/**
 * Utilidades para subida y gestión de imágenes en Supabase Storage (Bucket 'gallery')
 */

import { createClient } from "@/lib/supabase/server";

export interface UploadImageResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
}

/**
 * Sube una imagen al bucket de Supabase Storage y retorna la URL pública.
 */
export async function uploadGalleryImage(
  file: File,
  businessId: string,
  folder: string = "works"
): Promise<UploadImageResult> {
  try {
    const supabase = await createClient();

    // Validar tipo de archivo
    const validMimes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    if (!validMimes.includes(file.type)) {
      return {
        success: false,
        error: "Formato no permitido. Solo se aceptan imágenes JPG, PNG, WebP o HEIC.",
      };
    }

    // Validar tamaño máximo (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        success: false,
        error: "La imagen excede el límite máximo de 5MB.",
      };
    }

    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${businessId}/${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("gallery")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Error al subir a Supabase Storage:", uploadError);
      return { success: false, error: uploadError.message };
    }

    const { data: urlData } = supabase.storage
      .from("gallery")
      .getPublicUrl(fileName);

    return {
      success: true,
      publicUrl: urlData.publicUrl,
    };
  } catch (err: any) {
    console.error("Excepción en uploadGalleryImage:", err);
    return { success: false, error: err.message || "Error al procesar la imagen." };
  }
}

/**
 * Elimina un archivo de Supabase Storage dada su URL pública.
 */
export async function deleteStorageFile(publicUrl: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const parts = publicUrl.split("/gallery/");
    if (parts.length < 2) return false;

    const filePath = parts[1];
    const { error } = await supabase.storage.from("gallery").remove([filePath]);
    return !error;
  } catch (err) {
    console.error("Error al eliminar archivo de storage:", err);
    return false;
  }
}
