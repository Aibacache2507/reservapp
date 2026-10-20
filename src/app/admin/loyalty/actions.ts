"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface LoyaltyActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Publica u oculta una reseña en la página pública del negocio.
 */
export async function toggleReviewPublic(
  reviewId: string,
  isPublic: boolean
): Promise<LoyaltyActionResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "No autorizado." };

    const { error } = await supabase
      .from("reviews")
      .update({ is_public: isPublic })
      .eq("id", reviewId);

    if (error) {
      console.error("Error al actualizar visibilidad de reseña:", error);
      return { success: false, error: "No se pudo actualizar la visibilidad." };
    }

    revalidatePath("/admin/loyalty");
    return {
      success: true,
      message: isPublic ? "Reseña visible en la página pública." : "Reseña ocultada de la página pública.",
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Responde públicamente a una reseña de un cliente.
 */
export async function replyToReviewAction(formData: FormData): Promise<LoyaltyActionResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "No autorizado." };

    const reviewId = formData.get("review_id") as string;
    const replyText = (formData.get("reply_text") as string)?.trim();

    if (!reviewId || !replyText) {
      return { success: false, error: "El texto de respuesta no puede estar vacío." };
    }

    const { error } = await supabase
      .from("reviews")
      .update({
        business_reply: replyText,
        reply_at: new Date().toISOString(),
      })
      .eq("id", reviewId);

    if (error) {
      console.error("Error al responder reseña:", error);
      return { success: false, error: "No se pudo guardar la respuesta." };
    }

    revalidatePath("/admin/loyalty");
    return { success: true, message: "Respuesta publicada correctamente." };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
