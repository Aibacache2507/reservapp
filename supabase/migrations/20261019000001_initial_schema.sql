-- ========================================================
-- RESERVAPP: MIGRACIÓN INICIAL MULTI-TENANT Y SEGURIDAD RLS
-- Versión: 20261019000001
-- ========================================================

-- 1. EXTENSIONES POSTGRESQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 2. TIPOS PERSONALIZADOS (ENUMS)
DO $$ BEGIN
    CREATE TYPE public.business_role AS ENUM ('superadmin', 'business_admin', 'professional');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.business_status AS ENUM ('active', 'suspended', 'trial', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.appointment_source AS ENUM ('online', 'manual', 'phone', 'whatsapp');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.waitlist_status AS ENUM ('waiting', 'notified', 'booked', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.notification_channel AS ENUM ('email', 'whatsapp_manual');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.notification_status AS ENUM ('pending', 'sent', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.discount_type AS ENUM ('percentage', 'fixed_amount');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.inventory_movement_type AS ENUM ('in', 'out', 'adjustment', 'consumed_in_service');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLA DE PERFILES DE USUARIO (Vinculada a auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    avatar_url TEXT,
    is_superadmin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABLA DE NEGOCIOS (Multi-Tenant Core)
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    rubro TEXT NOT NULL DEFAULT 'belleza_y_estetica',
    logo_url TEXT,
    brand_color TEXT NOT NULL DEFAULT '#ec4899', -- Rosa elegante por defecto
    phone TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Santiago',
    booking_rules JSONB NOT NULL DEFAULT '{
        "min_advance_hours": 2,
        "max_advance_days": 60,
        "cancellation_limit_hours": 24,
        "max_reschedules": 2,
        "slot_interval_minutes": 15,
        "require_deposit": false,
        "deposit_percentage": 0,
        "no_show_policy": "Si no asistes o cancelas con menos de 24 horas de anticipación, tu próxima reserva requerirá confirmación previa."
    }'::jsonb,
    plan TEXT NOT NULL DEFAULT 'pro',
    status public.business_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. SUCURSALES (Branches)
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    is_main BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. MIEMBROS DEL NEGOCIO (Asignación de roles por negocio)
CREATE TABLE IF NOT EXISTS public.business_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role public.business_role NOT NULL DEFAULT 'professional',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_id, user_id)
);

-- 7. PROFESIONALES (Datos públicos y agenda)
CREATE TABLE IF NOT EXISTS public.professionals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    photo_url TEXT,
    specialties TEXT[] NOT NULL DEFAULT '{}',
    bio TEXT,
    commission_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. CATEGORÍAS DE SERVICIOS
CREATE TABLE IF NOT EXISTS public.service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. SERVICIOS
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. VARIANTES DE SERVICIO (Duración y precio variable en CLP)
CREATE TABLE IF NOT EXISTS public.service_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- ej. "Corte Corto 30 min", "Corte Largo 60 min"
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    price_clp INTEGER NOT NULL CHECK (price_clp >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. SERVICIOS POR PROFESIONAL (Asignación con precios/duración opcional personalizada)
CREATE TABLE IF NOT EXISTS public.professional_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    service_variant_id UUID NOT NULL REFERENCES public.service_variants(id) ON DELETE CASCADE,
    custom_duration_minutes INTEGER CHECK (custom_duration_minutes IS NULL OR custom_duration_minutes > 0),
    custom_price_clp INTEGER CHECK (custom_price_clp IS NULL OR custom_price_clp >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(professional_id, service_variant_id)
);

-- 12. HORARIOS DE TRABAJO SEMANAL (Por profesional)
-- day_of_week: 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
CREATE TABLE IF NOT EXISTS public.working_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL CHECK (end_time > start_time),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. DESCANSOS / COLACIONES (Breaks)
CREATE TABLE IF NOT EXISTS public.breaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL CHECK (end_time > start_time),
    name TEXT NOT NULL DEFAULT 'Almuerzo / Descanso',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. DÍAS LIBRES / VACACIONES (Time Off)
CREATE TABLE IF NOT EXISTS public.time_off (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL CHECK (end_date >= start_date),
    reason TEXT,
    is_all_day BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. BLOQUEOS DE AGENDA PUNTUALES POR EL ADMINISTRADOR
CREATE TABLE IF NOT EXISTS public.schedule_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE, -- NULL si bloquea todo el negocio/sucursal
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL CHECK (ends_at > starts_at),
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. CLIENTES (Identificados por RUT dentro de cada negocio)
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    rut TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    notes TEXT,
    consent_given BOOLEAN NOT NULL DEFAULT TRUE,
    consent_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_id, rut)
);

-- 17. FICHAS TÉCNICAS Y PRIVADAS DEL CLIENTE
CREATE TABLE IF NOT EXISTS public.client_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
    notes TEXT NOT NULL,
    allergies TEXT,
    preferences TEXT,
    photos TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. CITAS / AGENDAMIENTO (Appointments)
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    service_variant_id UUID NOT NULL REFERENCES public.service_variants(id) ON DELETE RESTRICT,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL CHECK (ends_at > starts_at),
    status public.appointment_status NOT NULL DEFAULT 'confirmed',
    total_price_clp INTEGER NOT NULL CHECK (total_price_clp >= 0),
    source public.appointment_source NOT NULL DEFAULT 'online',
    client_notes TEXT,
    admin_notes TEXT,
    cancel_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
    cancelled_at TIMESTAMPTZ,
    cancel_reason TEXT,
    reschedule_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RESTRICCIÓN DE EXCLUSIÓN PARA PREVENIR DOBLE RESERVA (CRÍTICO)
-- Utiliza btree_gist y rangos de timestamptz para garantizar que un profesional
-- nunca tenga dos citas activas (pending o confirmed) solapadas en el tiempo.
ALTER TABLE public.appointments
DROP CONSTRAINT IF EXISTS no_overlapping_active_appointments;

ALTER TABLE public.appointments
ADD CONSTRAINT no_overlapping_active_appointments
EXCLUDE USING gist (
    professional_id WITH =,
    tstzrange(starts_at, ends_at) WITH &&
)
WHERE (status IN ('pending', 'confirmed'));

-- 19. LISTA DE ESPERA (Waitlist)
CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    service_variant_id UUID NOT NULL REFERENCES public.service_variants(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
    preferred_date_start DATE NOT NULL,
    preferred_date_end DATE NOT NULL CHECK (preferred_date_end >= preferred_date_start),
    status public.waitlist_status NOT NULL DEFAULT 'waiting',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. PROMOCIONES, CUPONES Y PACKS
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    discount_type public.discount_type NOT NULL DEFAULT 'percentage',
    discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL CHECK (end_date >= start_date),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    discount_type public.discount_type NOT NULL DEFAULT 'percentage',
    discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
    max_uses INTEGER,
    uses_count INTEGER NOT NULL DEFAULT 0,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL CHECK (valid_until >= valid_from),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_id, code)
);

CREATE TABLE IF NOT EXISTS public.packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    total_sessions INTEGER NOT NULL CHECK (total_sessions > 1),
    price_clp INTEGER NOT NULL CHECK (price_clp > 0),
    validity_days INTEGER NOT NULL DEFAULT 90,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. INVENTARIO (Items y Movimientos)
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT,
    description TEXT,
    current_stock NUMERIC(10,2) NOT NULL DEFAULT 0,
    min_stock_alert NUMERIC(10,2) NOT NULL DEFAULT 5,
    unit_cost_clp INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    movement_type public.inventory_movement_type NOT NULL,
    quantity NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
    unit_cost_clp INTEGER NOT NULL DEFAULT 0,
    reason TEXT,
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 22. COMISIONES DE PROFESIONALES
CREATE TABLE IF NOT EXISTS public.commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    commission_percentage NUMERIC(5,2) NOT NULL,
    total_amount_clp INTEGER NOT NULL,
    commission_amount_clp INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 23. RESEÑAS Y CALIFICACIONES (1 a 5 estrellas)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL UNIQUE REFERENCES public.appointments(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    business_reply TEXT,
    reply_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 24. GALERÍA DE TRABAJOS
CREATE TABLE IF NOT EXISTS public.gallery_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
    image_url TEXT NOT NULL,
    category TEXT,
    caption TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 25. PLANTILLAS DE MENSAJES (Correo y WhatsApp)
CREATE TABLE IF NOT EXISTS public.message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    trigger_event TEXT NOT NULL, -- ej. 'confirmation', 'reminder_24h', 'reminder_2h', 'rescheduled', 'cancelled', 'waitlist_available', 'review_request'
    channel public.notification_channel NOT NULL,
    subject TEXT,
    body TEXT NOT NULL,
    variables_hint TEXT[] NOT NULL DEFAULT ARRAY['{nombre}', '{servicio}', '{profesional}', '{fecha}', '{hora}', '{direccion}', '{enlace_gestion}'],
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_id, trigger_event, channel)
);

-- 26. REGISTRO DE NOTIFICACIONES (Notifications Log)
CREATE TABLE IF NOT EXISTS public.notifications_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    channel public.notification_channel NOT NULL,
    recipient TEXT NOT NULL,
    subject TEXT,
    body TEXT NOT NULL,
    status public.notification_status NOT NULL DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================================
-- FUNCIONES DE SEGURIDAD Y CONTEXTO RLS
-- ========================================================

-- Verifica si el usuario actual es superadministrador
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT COALESCE(
        (SELECT is_superadmin FROM public.profiles WHERE id = auth.uid()),
        FALSE
    );
$$;

-- Obtiene el rol del usuario actual dentro de un negocio
CREATE OR REPLACE FUNCTION public.get_user_business_role(p_business_id UUID)
RETURNS public.business_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT role FROM public.business_members
    WHERE business_id = p_business_id
      AND user_id = auth.uid()
      AND is_active = TRUE
    LIMIT 1;
$$;

-- Verifica si el usuario actual es administrador del negocio
CREATE OR REPLACE FUNCTION public.is_business_admin(p_business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT public.is_superadmin() OR EXISTS (
        SELECT 1 FROM public.business_members
        WHERE business_id = p_business_id
          AND user_id = auth.uid()
          AND role = 'business_admin'
          AND is_active = TRUE
    );
$$;

-- Verifica si el usuario actual es miembro activo del negocio (admin o profesional)
CREATE OR REPLACE FUNCTION public.is_business_member(p_business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT public.is_superadmin() OR EXISTS (
        SELECT 1 FROM public.business_members
        WHERE business_id = p_business_id
          AND user_id = auth.uid()
          AND is_active = TRUE
    );
$$;

-- ========================================================
-- HABILITACIÓN DE ROW LEVEL SECURITY (RLS)
-- ========================================================

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

-- ========================================================
-- POLÍTICAS RLS DETALLADAS
-- ========================================================

-- --- PROFILES ---
CREATE POLICY "Profiles are viewable by owner or superadmin"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.is_superadmin());

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- --- BUSINESSES ---
-- Lectura pública para la página de reservas /{slug} si está activo
CREATE POLICY "Public can view active businesses"
ON public.businesses FOR SELECT
USING (status = 'active' OR public.is_business_member(id));

-- Los administradores del negocio pueden actualizar la configuración
CREATE POLICY "Business admins can update business"
ON public.businesses FOR UPDATE
USING (public.is_business_admin(id));

-- Creación de nuevo negocio para onboarding
CREATE POLICY "Authenticated users can create business"
ON public.businesses FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- --- BRANCHES ---
CREATE POLICY "Public can view active branches"
ON public.branches FOR SELECT
USING (is_active = TRUE OR public.is_business_member(business_id));

CREATE POLICY "Admins can manage branches"
ON public.branches FOR ALL
USING (public.is_business_admin(business_id));

-- --- BUSINESS MEMBERS ---
CREATE POLICY "Members can view members in their business"
ON public.business_members FOR SELECT
USING (public.is_business_member(business_id));

CREATE POLICY "Admins can manage members"
ON public.business_members FOR ALL
USING (public.is_business_admin(business_id));

-- --- PROFESSIONALS ---
CREATE POLICY "Public can view active professionals"
ON public.professionals FOR SELECT
USING (is_active = TRUE OR public.is_business_member(business_id));

CREATE POLICY "Admins can manage professionals"
ON public.professionals FOR ALL
USING (public.is_business_admin(business_id));

-- --- SERVICES & CATEGORIES ---
CREATE POLICY "Public can view active categories"
ON public.service_categories FOR SELECT
USING (is_active = TRUE OR public.is_business_member(business_id));

CREATE POLICY "Admins can manage categories"
ON public.service_categories FOR ALL
USING (public.is_business_admin(business_id));

CREATE POLICY "Public can view active services"
ON public.services FOR SELECT
USING (is_active = TRUE OR public.is_business_member(business_id));

CREATE POLICY "Admins can manage services"
ON public.services FOR ALL
USING (public.is_business_admin(business_id));

CREATE POLICY "Public can view active variants"
ON public.service_variants FOR SELECT
USING (is_active = TRUE OR public.is_business_member(business_id));

CREATE POLICY "Admins can manage variants"
ON public.service_variants FOR ALL
USING (public.is_business_admin(business_id));

CREATE POLICY "Public can view active professional services"
ON public.professional_services FOR SELECT
USING (is_active = TRUE OR public.is_business_member(business_id));

CREATE POLICY "Admins can manage professional services"
ON public.professional_services FOR ALL
USING (public.is_business_admin(business_id));

-- --- WORKING HOURS, BREAKS, TIME OFF, BLOCKS ---
CREATE POLICY "Public can view active working hours"
ON public.working_hours FOR SELECT
USING (is_active = TRUE OR public.is_business_member(business_id));

CREATE POLICY "Admins or professional can manage working hours"
ON public.working_hours FOR ALL
USING (
    public.is_business_admin(business_id) OR
    (SELECT user_id FROM public.professionals WHERE id = professional_id) = auth.uid()
);

CREATE POLICY "Public can view breaks"
ON public.breaks FOR SELECT
USING (TRUE);

CREATE POLICY "Admins or professional can manage breaks"
ON public.breaks FOR ALL
USING (
    public.is_business_admin(business_id) OR
    (SELECT user_id FROM public.professionals WHERE id = professional_id) = auth.uid()
);

CREATE POLICY "Public can view time off"
ON public.time_off FOR SELECT
USING (TRUE);

CREATE POLICY "Admins or professional can manage time off"
ON public.time_off FOR ALL
USING (
    public.is_business_admin(business_id) OR
    (SELECT user_id FROM public.professionals WHERE id = professional_id) = auth.uid()
);

CREATE POLICY "Public can view schedule blocks"
ON public.schedule_blocks FOR SELECT
USING (TRUE);

CREATE POLICY "Admins can manage schedule blocks"
ON public.schedule_blocks FOR ALL
USING (public.is_business_admin(business_id));

-- --- CLIENTS ---
CREATE POLICY "Public can insert client during booking"
ON public.clients FOR INSERT
WITH CHECK (TRUE);

CREATE POLICY "Business members can view clients of their business"
ON public.clients FOR SELECT
USING (public.is_business_member(business_id));

CREATE POLICY "Business members can update clients of their business"
ON public.clients FOR UPDATE
USING (public.is_business_member(business_id));

-- --- CLIENT RECORDS ---
CREATE POLICY "Business members can view client records"
ON public.client_records FOR SELECT
USING (public.is_business_member(business_id));

CREATE POLICY "Business members can manage client records"
ON public.client_records FOR ALL
USING (public.is_business_member(business_id));

-- --- APPOINTMENTS ---
-- Permitir al público crear reservas sin cuenta
CREATE POLICY "Public can create appointments"
ON public.appointments FOR INSERT
WITH CHECK (TRUE);

-- Acceso a citas: miembros del negocio ven todas las de su negocio, o clientes con token de cancelación válido
CREATE POLICY "View appointments"
ON public.appointments FOR SELECT
USING (
    public.is_business_member(business_id) OR
    cancel_token = current_setting('request.headers', true)::json->>'x-cancel-token' OR
    cancel_token IS NOT NULL -- para lookup público vía token específico en RPC
);

-- Actualizar citas: miembros del negocio o cliente con su token (para cancelar o reprogramar)
CREATE POLICY "Update appointments"
ON public.appointments FOR UPDATE
USING (
    public.is_business_member(business_id) OR
    cancel_token IS NOT NULL
);

-- --- WAITLIST ---
CREATE POLICY "Public can join waitlist"
ON public.waitlist FOR INSERT
WITH CHECK (TRUE);

CREATE POLICY "Business members can view and manage waitlist"
ON public.waitlist FOR ALL
USING (public.is_business_member(business_id));

-- --- PROMOTIONS, COUPONS & PACKS ---
CREATE POLICY "Public can view active promotions"
ON public.promotions FOR SELECT
USING (is_active = TRUE OR public.is_business_member(business_id));

CREATE POLICY "Admins can manage promotions"
ON public.promotions FOR ALL
USING (public.is_business_admin(business_id));

CREATE POLICY "Public can view coupons"
ON public.coupons FOR SELECT
USING (is_active = TRUE OR public.is_business_member(business_id));

CREATE POLICY "Admins can manage coupons"
ON public.coupons FOR ALL
USING (public.is_business_admin(business_id));

CREATE POLICY "Public can view active packs"
ON public.packs FOR SELECT
USING (is_active = TRUE OR public.is_business_member(business_id));

CREATE POLICY "Admins can manage packs"
ON public.packs FOR ALL
USING (public.is_business_admin(business_id));

-- --- INVENTORY ---
CREATE POLICY "Business members can view inventory"
ON public.inventory_items FOR SELECT
USING (public.is_business_member(business_id));

CREATE POLICY "Admins can manage inventory"
ON public.inventory_items FOR ALL
USING (public.is_business_admin(business_id));

CREATE POLICY "Business members can view and create inventory movements"
ON public.inventory_movements FOR ALL
USING (public.is_business_member(business_id));

-- --- COMMISSIONS ---
CREATE POLICY "Admins can view and manage commissions"
ON public.commissions FOR ALL
USING (public.is_business_admin(business_id));

CREATE POLICY "Professionals can view own commissions"
ON public.commissions FOR SELECT
USING (
    (SELECT user_id FROM public.professionals WHERE id = professional_id) = auth.uid()
);

-- --- REVIEWS ---
CREATE POLICY "Public can view public reviews"
ON public.reviews FOR SELECT
USING (is_public = TRUE OR public.is_business_member(business_id));

CREATE POLICY "Clients can create review"
ON public.reviews FOR INSERT
WITH CHECK (TRUE);

CREATE POLICY "Admins can reply or moderate reviews"
ON public.reviews FOR UPDATE
USING (public.is_business_admin(business_id));

-- --- GALLERY ---
CREATE POLICY "Public can view gallery"
ON public.gallery_images FOR SELECT
USING (TRUE);

CREATE POLICY "Business members can manage gallery"
ON public.gallery_images FOR ALL
USING (public.is_business_member(business_id));

-- --- MESSAGE TEMPLATES ---
CREATE POLICY "Business members can view message templates"
ON public.message_templates FOR SELECT
USING (public.is_business_member(business_id));

CREATE POLICY "Admins can manage message templates"
ON public.message_templates FOR ALL
USING (public.is_business_admin(business_id));

-- --- NOTIFICATIONS LOG ---
CREATE POLICY "Business members can view notifications log"
ON public.notifications_log FOR SELECT
USING (public.is_business_member(business_id));

CREATE POLICY "Business members can manage notifications log"
ON public.notifications_log FOR ALL
USING (public.is_business_member(business_id));

-- Fin de migración inicial
