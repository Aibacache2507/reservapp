-- ========================================================
-- RESERVAPP: DATOS SEMILLA (SEED DATA)
-- Negocio Demo: Salón Belleza & Glamour Providencia
-- ========================================================

-- Variables de IDs fijos para consistencia en pruebas
DO $$
DECLARE
    v_business_id UUID := 'b0000000-0000-0000-0000-000000000001';
    v_branch_providencia UUID := 'b1000000-0000-0000-0000-000000000001';
    v_branch_lascondes UUID := 'b1000000-0000-0000-0000-000000000002';
    
    v_prof_camila UUID := 'p0000000-0000-0000-0000-000000000001';
    v_prof_valentina UUID := 'p0000000-0000-0000-0000-000000000002';
    v_prof_diego UUID := 'p0000000-0000-0000-0000-000000000003';

    v_cat_corte UUID := 'c0000000-0000-0000-0000-000000000001';
    v_cat_color UUID := 'c0000000-0000-0000-0000-000000000002';
    v_cat_unas UUID := 'c0000000-0000-0000-0000-000000000003';

    v_srv_corte_mujer UUID := 's0000000-0000-0000-0000-000000000001';
    v_srv_corte_hombre UUID := 's0000000-0000-0000-0000-000000000002';
    v_srv_color UUID := 's0000000-0000-0000-0000-000000000003';
    v_srv_manicure UUID := 's0000000-0000-0000-0000-000000000004';

    v_var_corte_mujer_std UUID := 'v0000000-0000-0000-0000-000000000001';
    v_var_corte_mujer_largo UUID := 'v0000000-0000-0000-0000-000000000002';
    v_var_corte_barberia UUID := 'v0000000-0000-0000-0000-000000000003';
    v_var_balayage UUID := 'v0000000-0000-0000-0000-000000000004';
    v_var_color_raiz UUID := 'v0000000-0000-0000-0000-000000000005';
    v_var_manicure_perm UUID := 'v0000000-0000-0000-0000-000000000006';
    v_var_kapping UUID := 'v0000000-0000-0000-0000-000000000007';

    v_client_sofia UUID := 'c1111111-0000-0000-0000-000000000001';
    v_apt_demo UUID := 'a1111111-0000-0000-0000-000000000001';
BEGIN
    -- 1. CREACIÓN DEL NEGOCIO PRINCIPAL
    INSERT INTO public.businesses (
        id, slug, name, rubro, logo_url, brand_color, phone, whatsapp_number, email, address, city, plan, status
    ) VALUES (
        v_business_id,
        'salon-glamour',
        'Salón Belleza & Glamour Providencia',
        'peluqueria_estetica',
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&h=200&fit=crop',
        '#ec4899',
        '+56 9 9123 4567',
        '56991234567',
        'contacto@salonglamour.cl',
        'Av. Providencia 2133, Local 12',
        'Providencia, Santiago',
        'pro',
        'active'
    ) ON CONFLICT (id) DO NOTHING;

    -- 2. SUCURSALES
    INSERT INTO public.branches (id, business_id, name, address, phone, is_main, is_active)
    VALUES 
    (v_branch_providencia, v_business_id, 'Casa Central Providencia', 'Av. Providencia 2133, Local 12', '+56 9 9123 4567', TRUE, TRUE),
    (v_branch_lascondes, v_business_id, 'Sucursal El Golf', 'Av. Apoquindo 3400, Of. 201', '+56 9 9765 4321', FALSE, TRUE)
    ON CONFLICT (id) DO NOTHING;

    -- 3. PROFESIONALES
    INSERT INTO public.professionals (
        id, business_id, branch_id, name, email, phone, photo_url, specialties, bio, commission_percentage, is_active, display_order
    ) VALUES 
    (
        v_prof_camila, v_business_id, v_branch_providencia,
        'Camila Silva', 'camila@salonglamour.cl', '+56 9 9111 2222',
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop',
        ARRAY['Corte y Estilo', 'Colorimetría Experta', 'Asesoría de Imagen'],
        'Estilista senior con más de 10 años de trayectoria especializada en transformaciones y visagismo.',
        40.00, TRUE, 1
    ),
    (
        v_prof_valentina, v_business_id, v_branch_providencia,
        'Valentina Rojas', 'valentina@salonglamour.cl', '+56 9 9222 3333',
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop',
        ARRAY['Balayage', 'Babylights', 'Tratamientos Capilares Olaplex'],
        'Apasionada por los rubios saludables, técnicas de degradé y recuperación capilar intensiva.',
        35.00, TRUE, 2
    ),
    (
        v_prof_diego, v_business_id, v_branch_providencia,
        'Diego Morales', 'diego@salonglamour.cl', '+56 9 9333 4444',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
        ARRAY['Barbería Clásica', 'Fade', 'Corte Masculino Moderno'],
        'Especialista en cortes masculinos modernos, perfilado de barba con toalla caliente y styling.',
        45.00, TRUE, 3
    )
    ON CONFLICT (id) DO NOTHING;

    -- 4. CATEGORÍAS DE SERVICIOS
    INSERT INTO public.service_categories (id, business_id, name, description, display_order, is_active)
    VALUES 
    (v_cat_corte, v_business_id, 'Cortes y Peinados', 'Servicios profesionales de corte, lavado y finalización.', 1, TRUE),
    (v_cat_color, v_business_id, 'Coloración y Mechas', 'Técnicas avanzadas de iluminación, balayage y color.', 2, TRUE),
    (v_cat_unas, v_business_id, 'Manicure y Pedicure', 'Cuidado de uñas, kapping gel y esmaltado permanente ruso.', 3, TRUE)
    ON CONFLICT (id) DO NOTHING;

    -- 5. SERVICIOS
    INSERT INTO public.services (id, business_id, category_id, name, description, display_order, is_active)
    VALUES 
    (v_srv_corte_mujer, v_business_id, v_cat_corte, 'Corte de Cabello Dama', 'Incluye diagnóstico capilar, lavado premium y peinado.', 1, TRUE),
    (v_srv_corte_hombre, v_business_id, v_cat_corte, 'Corte Masculino y Barba', 'Corte con tijera o máquina más perfilado con toalla caliente.', 2, TRUE),
    (v_srv_color, v_business_id, v_cat_color, 'Coloración y Balayage', 'Trabajos de diseño de color con productos de máxima gama.', 3, TRUE),
    (v_srv_manicure, v_business_id, v_cat_unas, 'Manicure Permanente', 'Tratamiento de cutículas y esmaltado de alta duración.', 4, TRUE)
    ON CONFLICT (id) DO NOTHING;

    -- 6. VARIANTES DE SERVICIO (DURACIONES Y PRECIOS EN CLP)
    INSERT INTO public.service_variants (id, business_id, service_id, name, duration_minutes, price_clp, display_order, is_active)
    VALUES 
    (v_var_corte_mujer_std, v_business_id, v_srv_corte_mujer, 'Corte Corto / Medio + Secado', 45, 22000, 1, TRUE),
    (v_var_corte_mujer_largo, v_business_id, v_srv_corte_mujer, 'Corte Cabello Extra Largo + Peinado Ondas', 60, 28000, 2, TRUE),
    (v_var_corte_barberia, v_business_id, v_srv_corte_hombre, 'Corte Fade + Ritual de Barba', 45, 18000, 1, TRUE),
    (v_var_color_raiz, v_business_id, v_srv_color, 'Coloración en Raíz (hasta 2 cm)', 60, 35000, 1, TRUE),
    (v_var_balayage, v_business_id, v_srv_color, 'Balayage Completo + Matiz + Brushing', 150, 75000, 2, TRUE),
    (v_var_manicure_perm, v_business_id, v_srv_manicure, 'Manicure Rusa con Esmaltado Permanente', 60, 24000, 1, TRUE),
    (v_var_kapping, v_business_id, v_srv_manicure, 'Kapping Gel Fortalecedor + Esmaltado', 90, 32000, 2, TRUE)
    ON CONFLICT (id) DO NOTHING;

    -- 7. ASIGNACIÓN PROFESIONAL <-> SERVICIOS
    INSERT INTO public.professional_services (business_id, professional_id, service_variant_id, is_active)
    VALUES 
    -- Camila realiza cortes y color
    (v_business_id, v_prof_camila, v_var_corte_mujer_std, TRUE),
    (v_business_id, v_prof_camila, v_var_corte_mujer_largo, TRUE),
    (v_business_id, v_prof_camila, v_var_color_raiz, TRUE),
    (v_business_id, v_prof_camila, v_var_balayage, TRUE),
    -- Valentina realiza color, balayage y kapping
    (v_business_id, v_prof_valentina, v_var_balayage, TRUE),
    (v_business_id, v_prof_valentina, v_var_color_raiz, TRUE),
    (v_business_id, v_prof_valentina, v_var_manicure_perm, TRUE),
    (v_business_id, v_prof_valentina, v_var_kapping, TRUE),
    -- Diego realiza cortes masculinos
    (v_business_id, v_prof_diego, v_var_corte_barberia, TRUE),
    (v_business_id, v_prof_diego, v_var_corte_mujer_std, TRUE)
    ON CONFLICT (professional_id, service_variant_id) DO NOTHING;

    -- 8. HORARIOS SEMANALES (Lunes a Sábado de 09:30 a 19:30)
    -- Lunes(1) a Sábado(6)
    FOR d IN 1..6 LOOP
        INSERT INTO public.working_hours (business_id, professional_id, day_of_week, start_time, end_time, is_active)
        VALUES 
        (v_business_id, v_prof_camila, d, '09:30:00', '19:30:00', TRUE),
        (v_business_id, v_prof_valentina, d, '10:00:00', '20:00:00', TRUE),
        (v_business_id, v_prof_diego, d, '09:30:00', '19:00:00', TRUE);

        -- Descanso / Almuerzo de 14:00 a 15:00
        INSERT INTO public.breaks (business_id, professional_id, day_of_week, start_time, end_time, name)
        VALUES 
        (v_business_id, v_prof_camila, d, '14:00:00', '15:00:00', 'Almuerzo'),
        (v_business_id, v_prof_valentina, d, '14:30:00', '15:30:00', 'Almuerzo'),
        (v_business_id, v_prof_diego, d, '13:30:00', '14:30:00', 'Almuerzo');
    END LOOP;

    -- 9. CLIENTE DEMO CON RUT CHILENO
    INSERT INTO public.clients (
        id, business_id, rut, full_name, phone, email, notes, consent_given
    ) VALUES (
        v_client_sofia,
        v_business_id,
        '18.234.567-9',
        'Sofía Martínez Vial',
        '+56 9 8765 4321',
        'sofia.martinez@gmail.com',
        'Clienta preferencial, prefiere agua mineral sin gas.',
        TRUE
    ) ON CONFLICT (business_id, rut) DO NOTHING;

    -- 10. FICHA TÉCNICA DEL CLIENTE
    INSERT INTO public.client_records (
        business_id, client_id, professional_id, notes, allergies, preferences
    ) VALUES (
        v_business_id,
        v_client_sofia,
        v_prof_camila,
        'Cabello fino, decoloración previa nivel 8. Tono deseado: rubio ceniza 9.1.',
        'Sensibilidad leve a productos con amoníaco concentrado.',
        'No le gusta el secador a temperatura máxima.'
    );

    -- 11. CITA DEMO DE PRUEBA
    INSERT INTO public.appointments (
        id, business_id, branch_id, professional_id, service_variant_id, client_id,
        starts_at, ends_at, status, total_price_clp, source, client_notes, cancel_token
    ) VALUES (
        v_apt_demo,
        v_business_id,
        v_branch_providencia,
        v_prof_camila,
        v_var_corte_mujer_std,
        v_client_sofia,
        NOW() + INTERVAL '2 days' + INTERVAL '3 hours',
        NOW() + INTERVAL '2 days' + INTERVAL '3 hours 45 minutes',
        'confirmed',
        22000,
        'online',
        'Por favor confirmar si tienen estacionamiento disponible.',
        'demo_token_cancelacion_12345'
    ) ON CONFLICT (id) DO NOTHING;

    -- 12. PLANTILLAS DE MENSAJES (CORREO Y WHATSAPP)
    INSERT INTO public.message_templates (
        business_id, trigger_event, channel, subject, body
    ) VALUES 
    (
        v_business_id,
        'confirmation',
        'email',
        '¡Tu cita en Salón Belleza & Glamour está confirmada! ✨',
        'Hola {nombre},\n\nConfirmamos tu cita para el servicio de {servicio} con {profesional}.\n\n📅 Fecha: {fecha}\n⏰ Hora: {hora}\n📍 Dirección: {direccion}\n\nRecuerda que el pago se realiza directamente en el local al finalizar tu atención.\n\nSi necesitas revisar, cancelar o reprogramar tu hora, puedes hacerlo en este enlace:\n{enlace_gestion}\n\n¡Te esperamos con muchas ganas!\nEquipo Salón Belleza & Glamour'
    ),
    (
        v_business_id,
        'confirmation',
        'whatsapp_manual',
        NULL,
        '¡Hola {nombre}! 👋 Confirmamos tu cita para *{servicio}* con *{profesional}* el día *{fecha}* a las *{hora}* en {negocio} ({direccion}). Si necesitas revisar o reprogramar: {enlace_gestion}'
    ),
    (
        v_business_id,
        'reminder_24h',
        'whatsapp_manual',
        NULL,
        '¡Hola {nombre}! Te recordamos que mañana tienes cita para *{servicio}* a las *{hora}* en {negocio} ({direccion}). Por favor respóndenos este mensaje para confirmar tu asistencia. ¡Te esperamos!'
    ),
    (
        v_business_id,
        'waitlist_available',
        'whatsapp_manual',
        NULL,
        '¡Hola {nombre}! Se liberó un cupo para *{servicio}* el día *{fecha}* a las *{hora}*. Para tomarlo de inmediato: {enlace_gestion}'
    )
    ON CONFLICT (business_id, trigger_event, channel) DO NOTHING;

    -- 13. ITEM DE INVENTARIO DEMO
    INSERT INTO public.inventory_items (
        business_id, name, sku, description, current_stock, min_stock_alert, unit_cost_clp
    ) VALUES (
        v_business_id,
        'Tratamiento Olaplex N°4 Champú 250ml',
        'OLA-004-250',
        'Champú fortalecedor y reparador de enlaces capilares para uso en lavacabezas.',
        12,
        3,
        18500
    );

END $$;
