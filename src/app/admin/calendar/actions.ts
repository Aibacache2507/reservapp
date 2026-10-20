"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeChileanPhone, formatRut, validateRut } from "@/lib/utils/chile";
import { getActiveBusinessId } from "@/app/admin/settings/actions";
import type { AppointmentStatus } from "@/types/database";

export interface CalendarActionResult {
  success?: boolean;
  error?: string;
  message?: string;
}

/**
 * Crea una cita manualmente desde la agenda de recepción
 */
export async function createManualAppointment(
  formData: FormData
): Promise<CalendarActionResult> {
  const supabase = await createClient();
  const businessId = await getActiveBusinessId();
  if (!businessId) return { error: "No autorizado." };

  const professionalId = formData.get("professional_id") as string;
  const serviceVariantId = formData.get("service_variant_id") as string;
  const branchId = (formData.get("branch_id") as string) || null;
  const startsAt = formData.get("starts_at") as string;
  const endsAt = formData.get("ends_at") as string;
  const clientName = (formData.get("client_name") as string)?.trim();
  const rawRut = (formData.get("client_rut") as string)?.trim() || "11.111.111-1";
  const phone = (formData.get("client_phone") as string)?.trim();
  const email = (formData.get("client_email") as string)?.trim() || `${Date.now()}@cliente.local`;
  const adminNotes = (formData.get("admin_notes") as string)?.trim() || null;
  const rawPrice = parseInt(formData.get("total_price_clp") as string, 10);

  if (!professionalId || !serviceVariantId || !startsAt || !endsAt || !clientName) {
    return { error: "Completa los campos obligatorios para agendar la cita." };
  }

  const normalizedPhone = phone ? normalizeChileanPhone(phone) : "+56 9 0000 0000";
  const formattedRut = formatRut(rawRut);

  // 1. Obtener o crear cliente en este negocio
  const { data: client, error: cErr }: any = await supabase
    .from("clients")
    .upsert(
      {
        business_id: businessId,
        rut: formattedRut,
        full_name: clientName,
        phone: normalizedPhone,
        email,
        consent_given: true,
      },
      { onConflict: "business_id,rut" }
    )
    .select("id")
    .single();

  if (cErr || !client) {
    return { error: "Error al registrar cliente: " + (cErr?.message || "") };
  }

  const cancelToken = Math.random().toString(36).substring(2, 15);

  // 2. Insertar cita
  const { error: aptErr } = await supabase.from("appointments").insert({
    business_id: businessId,
    branch_id: branchId,
    professional_id: professionalId,
    service_variant_id: serviceVariantId,
    client_id: client.id,
    starts_at: startsAt,
    ends_at: endsAt,
    status: "confirmed",
    total_price_clp: isNaN(rawPrice) ? 0 : rawPrice,
    source: "manual",
    admin_notes: adminNotes,
    cancel_token: cancelToken,
  });

  if (aptErr) {
    if (aptErr.code === "23P01" || aptErr.message?.includes("no_overlapping_active_appointments")) {
      return {
        error: "Conflicto de horario: El profesional ya tiene una cita activa en ese rango de tiempo.",
      };
    }
    return { error: aptErr.message };
  }

  revalidatePath("/admin/calendar");
  return { success: true, message: "Cita creada exitosamente en la agenda." };
}

/**
 * Actualiza el estado de la cita (completada, cancelada, no_show) y su precio final
 */
export async function updateAppointmentStatus(
  appointmentId: string,
  newStatus: AppointmentStatus,
  finalPriceClp?: number,
  cancelReason?: string
): Promise<CalendarActionResult> {
  const supabase = await createClient();
  const businessId = await getActiveBusinessId();
  if (!businessId) return { error: "No autorizado." };

  const updateData: any = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (finalPriceClp !== undefined && !isNaN(finalPriceClp)) {
    updateData.total_price_clp = finalPriceClp;
  }

  if (newStatus === "cancelled") {
    updateData.cancelled_at = new Date().toISOString();
    updateData.cancel_reason = cancelReason || "Cancelada manualmente por administración";
  }

  const { error } = await supabase
    .from("appointments")
    .update(updateData)
    .eq("id", appointmentId)
    .eq("business_id", businessId);

  if (error) return { error: error.message };

  // Si la cita fue completada, calcular/registrar la comisión para el profesional
  if (newStatus === "completed") {
    const { data: apt }: any = await supabase
      .from("appointments")
      .select("total_price_clp, professional_id, professionals(commission_percentage)")
      .eq("id", appointmentId)
      .single();

    if (apt && apt.professionals) {
      const commPct = Number(apt.professionals.commission_percentage || 0);
      const totalAmount = apt.total_price_clp || 0;
      const commAmount = Math.round((totalAmount * commPct) / 100);

      await supabase.from("commissions").upsert(
        {
          business_id: businessId,
          professional_id: apt.professional_id,
          appointment_id: appointmentId,
          commission_percentage: commPct,
          total_amount_clp: totalAmount,
          commission_amount_clp: commAmount,
          status: "pending",
        },
        { onConflict: "appointment_id" }
      );
    }
  }

  revalidatePath("/admin/calendar");
  return { success: true, message: "Estado de la cita actualizado." };
}

/**
 * Mover o reprogramar una cita de horario en la agenda (drag & drop o edición manual)
 */
export async function moveAppointment(
  appointmentId: string,
  newStartsAt: string,
  newEndsAt: string,
  newProfessionalId?: string
): Promise<CalendarActionResult> {
  const supabase = await createClient();
  const businessId = await getActiveBusinessId();
  if (!businessId) return { error: "No autorizado." };

  const updatePayload: any = {
    starts_at: newStartsAt,
    ends_at: newEndsAt,
    updated_at: new Date().toISOString(),
  };

  if (newProfessionalId) {
    updatePayload.professional_id = newProfessionalId;
  }

  const { error } = await supabase
    .from("appointments")
    .update(updatePayload)
    .eq("id", appointmentId)
    .eq("business_id", businessId);

  if (error) {
    if (error.code === "23P01" || error.message?.includes("no_overlapping_active_appointments")) {
      return {
        error: "No se puede mover la cita: El horario entra en conflicto con otra cita activa.",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/admin/calendar");
  return { success: true, message: "Cita movida exitosamente." };
}

/**
 * Crear un bloqueo de agenda (reunión, corte de luz, mantención, etc.)
 */
export async function createScheduleBlock(
  formData: FormData
): Promise<CalendarActionResult> {
  const supabase = await createClient();
  const businessId = await getActiveBusinessId();
  if (!businessId) return { error: "No autorizado." };

  const professionalId = (formData.get("professional_id") as string) || null;
  const startsAt = formData.get("starts_at") as string;
  const endsAt = formData.get("ends_at") as string;
  const reason = (formData.get("reason") as string)?.trim() || "Bloqueo administrativo";

  if (!startsAt || !endsAt) {
    return { error: "Ingresa inicio y fin del bloqueo." };
  }

  const { error } = await supabase.from("schedule_blocks").insert({
    business_id: businessId,
    professional_id: professionalId,
    starts_at: startsAt,
    ends_at: endsAt,
    reason,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/calendar");
  return { success: true, message: "Bloqueo de horario creado." };
}

/**
 * Eliminar un bloqueo de agenda
 */
export async function deleteScheduleBlock(
  blockId: string
): Promise<CalendarActionResult> {
  const supabase = await createClient();
  const businessId = await getActiveBusinessId();
  if (!businessId) return { error: "No autorizado." };

  const { error } = await supabase
    .from("schedule_blocks")
    .delete()
    .eq("id", blockId)
    .eq("business_id", businessId);

  if (error) return { error: error.message };

  revalidatePath("/admin/calendar");
  return { success: true, message: "Bloqueo eliminado." };
}
