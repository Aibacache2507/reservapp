"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { uploadGalleryImage, deleteStorageFile } from "@/lib/services/storage";

export interface GalleryActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Agrega una nueva imagen a la galería de trabajos (vía archivo o URL).
 */
export async function addGalleryImage(formData: FormData): Promise<GalleryActionResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "No autorizado." };

    const businessId = formData.get("business_id") as string;
    const category = (formData.get("category") as string)?.trim() || "Trabajos";
    const caption = (formData.get("caption") as string)?.trim() || null;
    const professionalId = (formData.get("professional_id") as string) || null;
    const imageUrlInput = (formData.get("image_url") as string)?.trim();
    const file = formData.get("image_file") as File | null;

    let finalImageUrl = imageUrlInput;

    if (file && file.size > 0) {
      const uploadRes = await uploadGalleryImage(file, businessId, "works");
      if (!uploadRes.success || !uploadRes.publicUrl) {
        return { success: false, error: uploadRes.error || "Fallo al subir la imagen a Storage." };
      }
      finalImageUrl = uploadRes.publicUrl;
    }

    if (!finalImageUrl) {
      return { success: false, error: "Debes seleccionar un archivo de imagen o ingresar una URL válida." };
    }

    // Obtener el siguiente display_order
    const { data: lastImg } = await supabase
      .from("gallery_images")
      .select("display_order")
      .eq("business_id", businessId)
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (lastImg?.display_order || 0) + 1;

    const { error: insErr } = await supabase.from("gallery_images").insert({
      business_id: businessId,
      image_url: finalImageUrl,
      category,
      caption,
      professional_id: professionalId,
      display_order: nextOrder,
    });

    if (insErr) {
      console.error("Error al registrar imagen en base de datos:", insErr);
      return { success: false, error: "No se pudo guardar la imagen en la galería." };
    }

    revalidatePath("/admin/gallery");
    return { success: true, message: "Imagen agregada a la galería con éxito." };
  } catch (err: any) {
    console.error("Excepción en addGalleryImage:", err);
    return { success: false, error: err.message || "Error al procesar la imagen." };
  }
}

/**
 * Elimina una imagen de la galería y de Supabase Storage.
 */
export async function deleteGalleryImage(imageId: string): Promise<GalleryActionResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "No autorizado." };

    const { data: img } = await supabase
      .from("gallery_images")
      .select("image_url")
      .eq("id", imageId)
      .single();

    if (img?.image_url) {
      await deleteStorageFile(img.image_url);
    }

    const { error } = await supabase.from("gallery_images").delete().eq("id", imageId);
    if (error) {
      return { success: false, error: "No se pudo eliminar la imagen." };
    }

    revalidatePath("/admin/gallery");
    return { success: true, message: "Imagen eliminada de la galería." };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
