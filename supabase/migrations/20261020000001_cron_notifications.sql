-- ============================================================================
-- RESERVAPP - CONFIGURACIÓN DE CRON AUTOMÁTICO PARA RECORDATORIOS (ETAPA 5)
-- ============================================================================
-- Habilita la extensión pg_cron y programa la ejecución periódica del cron
-- de recordatorios y avisos cada 15 minutos en horario de Santiago de Chile.
-- ============================================================================

-- Habilitar extensión pg_cron y pg_net si no existen
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Función envoltorio para invocar el endpoint de cron de Next.js / Edge Function
CREATE OR REPLACE FUNCTION public.trigger_reminders_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    app_url TEXT;
    cron_secret TEXT;
BEGIN
    -- Obtener variables de configuración (o usar URL por defecto)
    app_url := current_setting('app.settings.service_url', true);
    IF app_url IS NULL OR app_url = '' THEN
        app_url := 'https://reservapp.cl/api/cron/reminders';
    END IF;

    cron_secret := current_setting('app.settings.cron_secret', true);

    -- Enviar petición HTTP POST asíncrona usando pg_net
    PERFORM net.http_post(
        url := app_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || COALESCE(cron_secret, '')
        ),
        body := '{}'::jsonb
    );
END;
$$;

-- Programar ejecución cada 15 minutos con pg_cron
-- Nota: La zona horaria se respeta según los rangos UTC calculados por la función
SELECT cron.schedule(
    'reservapp_reminders_every_15min',
    '*/15 * * * *',
    'SELECT public.trigger_reminders_cron();'
);

COMMENT ON FUNCTION public.trigger_reminders_cron IS 'Ejecuta el escaneo de citas para envío de recordatorios automáticos (24h y 2h) vía Resend';
