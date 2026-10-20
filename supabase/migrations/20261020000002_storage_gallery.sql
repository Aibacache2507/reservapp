-- ============================================================================
-- RESERVAPP - CONFIGURACIÓN DE STORAGE PARA GALERÍA DE TRABAJOS (ETAPA 7)
-- ============================================================================

-- 1. Crear bucket público 'gallery' en storage.buckets si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'gallery',
    'gallery',
    true,
    5242880, -- Límite de 5MB por imagen
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

-- 2. Políticas RLS para lectura pública de imágenes de galería
CREATE POLICY "Gallery images are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'gallery');

-- 3. Políticas RLS para subida y edición por usuarios autenticados del negocio
CREATE POLICY "Business members can upload gallery images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'gallery');

CREATE POLICY "Business members can delete gallery images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'gallery');
