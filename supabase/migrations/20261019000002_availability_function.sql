-- ========================================================
-- RESERVAPP: FUNCIÓN RPC PARA CÁLCULO DE DISPONIBILIDAD
-- Versión: 20261019000002
-- ========================================================

CREATE OR REPLACE FUNCTION public.get_available_slots(
    p_business_id UUID,
    p_service_variant_id UUID,
    p_professional_id UUID DEFAULT NULL,
    p_date DATE DEFAULT CURRENT_DATE,
    p_timezone TEXT DEFAULT 'America/Santiago'
)
RETURNS TABLE (
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    professional_id UUID,
    professional_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_base_duration INTEGER;
    v_min_advance_hours NUMERIC;
    v_max_advance_days INTEGER;
    v_slot_interval INTEGER;
    v_dow INTEGER;
    v_now_in_tz TIMESTAMPTZ;
    v_today_in_tz DATE;
    v_min_allowed_time TIMESTAMPTZ;
BEGIN
    -- 1. Obtener la duración base del servicio
    SELECT duration_minutes INTO v_base_duration
    FROM public.service_variants
    WHERE id = p_service_variant_id
      AND business_id = p_business_id
      AND is_active = TRUE;

    IF v_base_duration IS NULL THEN
        RETURN;
    END IF;

    -- 2. Obtener reglas de reserva del negocio
    SELECT 
        COALESCE((booking_rules->>'min_advance_hours')::NUMERIC, 2),
        COALESCE((booking_rules->>'max_advance_days')::INTEGER, 60),
        COALESCE((booking_rules->>'slot_interval_minutes')::INTEGER, 15)
    INTO 
        v_min_advance_hours,
        v_max_advance_days,
        v_slot_interval
    FROM public.businesses
    WHERE id = p_business_id;

    -- 3. Validar ventana de tiempo respecto a la zona horaria del negocio
    v_now_in_tz := NOW() AT TIME ZONE p_timezone;
    v_today_in_tz := (NOW() AT TIME ZONE p_timezone)::DATE;
    v_min_allowed_time := NOW() + (v_min_advance_hours * INTERVAL '1 hour');

    -- No permitir fechas en el pasado
    IF p_date < v_today_in_tz THEN
        RETURN;
    END IF;

    -- No permitir fechas más allá del límite de anticipación
    IF p_date > (v_today_in_tz + (v_max_advance_days * INTERVAL '1 day'))::DATE THEN
        RETURN;
    END IF;

    -- Día de la semana (0 = Domingo, 1 = Lunes, ..., 6 = Sábado)
    v_dow := EXTRACT(DOW FROM p_date)::INTEGER;

    -- 4. Retornar los slots disponibles
    RETURN QUERY
    WITH candidate_professionals AS (
        -- Profesionales activos que ofrecen este servicio y pertenecen al negocio
        SELECT 
            p.id AS prof_id,
            p.name AS prof_name,
            COALESCE(ps.custom_duration_minutes, v_base_duration) AS eff_duration
        FROM public.professionals p
        JOIN public.professional_services ps 
          ON ps.professional_id = p.id 
         AND ps.service_variant_id = p_service_variant_id
         AND ps.is_active = TRUE
        WHERE p.business_id = p_business_id
          AND p.is_active = TRUE
          AND (p_professional_id IS NULL OR p.id = p_professional_id)
          -- Excluir si el profesional tiene día libre / vacaciones todo el día
          AND NOT EXISTS (
              SELECT 1 FROM public.time_off t
              WHERE t.professional_id = p.id
                AND t.is_all_day = TRUE
                AND p_date BETWEEN t.start_date AND t.end_date
          )
    ),
    working_windows AS (
        -- Horario de trabajo del profesional para este día de la semana
        SELECT 
            cp.prof_id,
            cp.prof_name,
            cp.eff_duration,
            wh.start_time,
            wh.end_time
        FROM candidate_professionals cp
        JOIN public.working_hours wh 
          ON wh.professional_id = cp.prof_id
         AND wh.day_of_week = v_dow
         AND wh.is_active = TRUE
    ),
    slot_series AS (
        -- Generar intervalos de slots dentro de la jornada laboral
        SELECT 
            ww.prof_id,
            ww.prof_name,
            ww.eff_duration,
            (p_date + (series.slot_sec * INTERVAL '1 second'))::TIMESTAMP AS local_slot_start,
            (p_date + ((series.slot_sec + (ww.eff_duration * 60)) * INTERVAL '1 second'))::TIMESTAMP AS local_slot_end,
            ww.end_time
        FROM working_windows ww,
        LATERAL generate_series(
            (EXTRACT(HOUR FROM ww.start_time) * 3600 + EXTRACT(MINUTE FROM ww.start_time) * 60)::INTEGER,
            (EXTRACT(HOUR FROM ww.end_time) * 3600 + EXTRACT(MINUTE FROM ww.end_time) * 60 - (ww.eff_duration * 60))::INTEGER,
            (v_slot_interval * 60)
        ) AS series(slot_sec)
    ),
    filtered_slots AS (
        SELECT 
            (ss.local_slot_start AT TIME ZONE p_timezone) AS slot_start_utc,
            (ss.local_slot_end AT TIME ZONE p_timezone) AS slot_end_utc,
            ss.prof_id,
            ss.prof_name
        FROM slot_series ss
        WHERE 
            -- Asegurar que termine dentro del horario de atención del profesional
            ss.local_slot_end::TIME <= ss.end_time
            -- Asegurar anticipación mínima respecto a la hora actual
            AND (ss.local_slot_start AT TIME ZONE p_timezone) >= v_min_allowed_time
            -- Descartar descansos (breaks)
            AND NOT EXISTS (
                SELECT 1 FROM public.breaks b
                WHERE b.professional_id = ss.prof_id
                  AND b.day_of_week = v_dow
                  AND NOT (ss.local_slot_end::TIME <= b.start_time OR ss.local_slot_start::TIME >= b.end_time)
            )
            -- Descartar bloqueos de agenda del local o del profesional (schedule_blocks)
            AND NOT EXISTS (
                SELECT 1 FROM public.schedule_blocks sb
                WHERE sb.business_id = p_business_id
                  AND (sb.professional_id IS NULL OR sb.professional_id = ss.prof_id)
                  AND tstzrange(ss.local_slot_start AT TIME ZONE p_timezone, ss.local_slot_end AT TIME ZONE p_timezone) && tstzrange(sb.starts_at, sb.ends_at)
            )
            -- Descartar citas ya existentes activas (pending o confirmed)
            AND NOT EXISTS (
                SELECT 1 FROM public.appointments a
                WHERE a.professional_id = ss.prof_id
                  AND a.status IN ('pending', 'confirmed')
                  AND tstzrange(ss.local_slot_start AT TIME ZONE p_timezone, ss.local_slot_end AT TIME ZONE p_timezone) && tstzrange(a.starts_at, a.ends_at)
            )
    )
    SELECT 
        fs.slot_start_utc AS starts_at,
        fs.slot_end_utc AS ends_at,
        fs.prof_id AS professional_id,
        fs.prof_name AS professional_name
    FROM filtered_slots fs
    ORDER BY fs.slot_start_utc ASC, fs.prof_name ASC;
END;
$$;
