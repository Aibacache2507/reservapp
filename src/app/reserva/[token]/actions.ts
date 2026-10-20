"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface CancelResult {
  success?: boolean;
  error?: string;
  message?: string;
}

/**
 * Cancelación de cita por parte del cliente usando su token único y seguro
 */
export async function cancelAppointmentByToken(
  token: string,
  reason: string
): Promise<CancelResult> {
  if (!token) return { error: "Token de cita inválido." };

  const supabase = await createClient();

  // 1. Obtener la cita y las reglas del negocio
  const { data: apt }: any = await supabase
    .from("appointments")
    .select("id, starts_at, status, business_id, businesses(booking_rules, name, phone)")
    .eq("cancel_token", token)
    .maybeSingle();

  if (!apt) {
    return { error: "No se encontró la reserva solicitada." };
  }

  if (apt.status === "cancelled") {
    return { error: "Esta cita ya se encuentra cancelada." };
  }

  if (apt.status === "completed") {
    return { error: "Esta cita ya fue completada y no puede ser cancelada." };
  }

  // 2. Verificar plazo límite de cancelación (ej. 24 horas antes)
  const rules = apt.businesses?.booking_rules || {};
  const limitHours = rules.cancellation_limit_hours ?? 24;

  const startsAt = new Date(apt.starts_at).getTime();
  const now = Date.now();
  const hoursRemaining = (startsAt - now) / (1000 * 60 * 60);

  if (hoursRemaining < limitHours) {
    return {
      error: `El plazo para cancelar de forma automática ha vencido (requiere al menos ${limitHours} horas de anticipación). Por favor contacta directamente a ${apt.businesses?.name || "el local"} al ${apt.businesses?.phone || ""}.`,
    };
  }

  // 3. Cancelar la cita
  const { error } = await supabase
    .from("appointments")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancel_reason: reason || "Cancelada por el cliente desde portal web",
      updated_at: new Date().toISOString(),
    })
    .eq("id", apt.id);

  if (error) {
    return { error: error.message || "Error al cancelar la cita." };
  }

  revalidatePath(`/reserva/${token}`);
  return {
    success: true,
    message: "Tu cita ha sido cancelada exitosamente.",
  };
}

/**
 * Reprogramación de cita usando el token
 */
export async function rescheduleAppointmentByToken(
  token: string,
  newStartsAt: string,
  newEndsAt: string,
  newProfessionalId: string
): Promise<CancelResult> {
  if (!token || !newStartsAt || !newEndsAt) {
    return { error: "Datos de reprogramación incompletos." };
  }

  const supabase = await createClient();

  const { data: apt }: any = await supabase
    .from("appointments")
    .select("id, starts_at, status, reschedule_count, businesses(booking_rules)")
    .eq("cancel_token", token)
    .maybeSingle();

  if (!apt) return { error: "Cita no encontrada." };
  if (apt.status !== "confirmed" && apt.status !== "pending") {
    return { error: "Esta cita no puede ser reprogramada en su estado actual." };
  }

  const rules = apt.businesses?.booking_rules || {};
  const maxReschedules = rules.max_reschedules ?? 2;
  const limitHours = rules.cancellation_limit_hours ?? 24;

  if (apt.reschedule_count >= maxReschedules) {
    return {
      error: `Has alcanzado el límite máximo de ${maxReschedules} reprogramaciones permitidas para esta cita.`,
    };
  }

  const startsAt = new Date(apt.starts_at).getTime();
  const hoursRemaining = (startsAt - Date.now()) / (1000 * 60 * 60);

  if (hoursRemaining < limitHours) {
    return {
      error: `La reprogramación debe solicitarse con al menos ${limitHours} horas de anticipación.`,
    };
  }

  const { error } = await supabase
    .from("appointments")
    .update({
      starts_at: newStartsAt,
      ends_at: newEndsAt,
      professional_id: newProfessionalId,
      reschedule_count: (apt.reschedule_count || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", apt.id);

  if (error) {
    if (error.code === "23P01" || error.message?.includes("no_overlapping_active_appointments")) {
      return {
        error: "El nuevo horario seleccionado ya fue tomado por otro cliente. Elige otro horario.",
      };
    }
    return { error: error.message };
  }

  revalidatePath(`/reserva/${token}`);
  return {
    success: true,
    message: "¡Tu cita ha sido reprogramada con éxito!",
  };
}
