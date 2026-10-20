"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ReviewActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Guarda la reseña de una cita completada, asegurando que solo se califique una vez.
 */
export async function submitAppointmentReview(
  formData: FormData
): Promise<ReviewActionResult> {
  try {
    const supabase = await createClient();

    const token = formData.get("token") as string;
    const rating = parseInt(formData.get("rating") as string, 10);
    const comment = (formData.get("comment") as string)?.trim() || null;

    if (!token || !rating || rating < 1 || rating > 5) {
      return { success: false, error: "Por favor selecciona una calificación de 1 a 5 estrellas." };
    }

    // 1. Obtener cita y verificar que esté completada
    const { data: apt, error: aptErr }: any = await supabase
      .from("appointments")
      .select("id, status, business_id, client_id, professional_id")
      .eq("cancel_token", token)
      .maybeSingle();

    if (aptErr || !apt) {
      return { success: false, error: "No se encontró la reserva solicitada." };
    }

    if (apt.status !== "completed") {
      return {
        success: false,
        error: "Solo puedes calificar una cita que haya sido completada y realizada en el local.",
      };
    }

    // 2. Verificar que no exista ya una reseña para esta cita (regla: solo una vez)
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("appointment_id", apt.id)
      .maybeSingle();

    if (existingReview) {
      return {
        success: false,
        error: "Esta cita ya fue calificada previamente. ¡Muchas gracias por tu opinión!",
      };
    }

    // 3. Insertar reseña
    const { error: revErr } = await supabase.from("reviews").insert({
      business_id: apt.business_id,
      appointment_id: apt.id,
      client_id: apt.client_id,
      professional_id: apt.professional_id,
      rating,
      comment,
      is_public: true, // Visible por defecto para moderación
    });

    if (revErr) {
      if (revErr.code === "23505" || revErr.message?.includes("reviews_appointment_id_key")) {
        return {
          success: false,
          error: "Esta cita ya fue calificada previamente.",
        };
      }
      console.error("Error al registrar reseña:", revErr);
      return { success: false, error: "Ocurrió un error al guardar tu calificación." };
    }

    revalidatePath(`/reserva/${token}`);
    revalidatePath(`/reserva/${token}/review`);
    return {
      success: true,
      message: "¡Muchas gracias! Tu opinión ha sido registrada exitosamente.",
    };
  } catch (err: any) {
    console.error("Excepción en submitAppointmentReview:", err);
    return { success: false, error: err.message || "Error al procesar la reseña." };
  }
}
