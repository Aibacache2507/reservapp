"use server";

import { createClient } from "@/lib/supabase/server";
import {
  validateRut,
  cleanRut,
  formatRut,
  normalizeChileanPhone,
  isValidChileanPhone,
  formatCLP,
} from "@/lib/utils/chile";
import { formatChileanDate, formatChileanTime } from "@/lib/utils/dates";
import { sendNotificationEmail } from "@/lib/notifications/email";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import type { AvailableSlot } from "@/types/database";

export interface BookingResult {
  success?: boolean;
  appointment?: {
    id: string;
    cancel_token: string;
    starts_at: string;
    ends_at: string;
    total_price_clp: number;
    professional_name: string;
    service_name: string;
    client_name: string;
    client_phone: string;
  };
  error?: string;
}

export interface CouponResult {
  valid: boolean;
  discount_amount_clp: number;
  final_price_clp: number;
  message: string;
}

/**
 * Consulta los horarios disponibles en tiempo real invocando la función RPC de PostgreSQL
 */
export async function fetchAvailableSlots(
  businessId: string,
  serviceVariantId: string,
  professionalId: string | null,
  dateString: string // YYYY-MM-DD
): Promise<AvailableSlot[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_available_slots", {
    p_business_id: businessId,
    p_service_variant_id: serviceVariantId,
    p_professional_id: professionalId || null,
    p_date: dateString,
    p_timezone: "America/Santiago",
  });

  if (error) {
    console.error("Error al consultar get_available_slots RPC:", error);
    return [];
  }

  return (data as AvailableSlot[]) || [];
}

/**
 * Valida y calcula el descuento de un cupón en CLP
 */
export async function applyCouponCode(
  businessId: string,
  code: string,
  basePriceClp: number
): Promise<CouponResult> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) {
    return {
      valid: false,
      discount_amount_clp: 0,
      final_price_clp: basePriceClp,
      message: "Ingresa un código de cupón.",
    };
  }

  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: coupon }: any = await supabase
    .from("coupons")
    .select("*")
    .eq("business_id", businessId)
    .eq("code", cleanCode)
    .eq("is_active", true)
    .maybeSingle();

  if (!coupon) {
    return {
      valid: false,
      discount_amount_clp: 0,
      final_price_clp: basePriceClp,
      message: "El cupón ingresado no existe o no está activo.",
    };
  }

  if (coupon.valid_from && coupon.valid_from > today) {
    return {
      valid: false,
      discount_amount_clp: 0,
      final_price_clp: basePriceClp,
      message: "Este cupón aún no entra en vigencia.",
    };
  }

  if (coupon.valid_until && coupon.valid_until < today) {
    return {
      valid: false,
      discount_amount_clp: 0,
      final_price_clp: basePriceClp,
      message: "Este cupón ha vencido.",
    };
  }

  if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
    return {
      valid: false,
      discount_amount_clp: 0,
      final_price_clp: basePriceClp,
      message: "Este cupón ha alcanzado su límite de usos.",
    };
  }

  let discount = 0;
  if (coupon.discount_type === "percentage") {
    discount = Math.round((basePriceClp * Number(coupon.discount_value)) / 100);
  } else {
    discount = Math.round(Number(coupon.discount_value));
  }

  discount = Math.min(discount, basePriceClp);
  const finalPrice = Math.max(0, basePriceClp - discount);

  return {
    valid: true,
    discount_amount_clp: discount,
    final_price_clp: finalPrice,
    message: `¡Cupón aplicado con éxito! Descuento de $${discount.toLocaleString("es-CL")}.`,
  };
}

/**
 * Crea una nueva cita para un cliente (sin requerir cuenta previa)
 */
export async function createAppointmentBooking(
  formData: FormData
): Promise<BookingResult> {
  const supabase = await createClient();

  const businessId = formData.get("business_id") as string;
  const branchId = (formData.get("branch_id") as string) || null;
  const serviceVariantId = formData.get("service_variant_id") as string;
  const professionalId = formData.get("professional_id") as string;
  const startsAt = formData.get("starts_at") as string;
  const endsAt = formData.get("ends_at") as string;
  const rawRut = (formData.get("client_rut") as string)?.trim();
  const fullName = (formData.get("client_name") as string)?.trim();
  const phone = (formData.get("client_phone") as string)?.trim();
  const email = (formData.get("client_email") as string)?.trim().toLowerCase();
  const clientNotes = (formData.get("client_notes") as string)?.trim() || null;
  const rawPrice = parseInt(formData.get("total_price_clp") as string, 10);
  const couponCode = (formData.get("coupon_code") as string)?.trim() || null;

  // 1. Validaciones de entrada obligatorias
  if (
    !businessId ||
    !serviceVariantId ||
    !professionalId ||
    !startsAt ||
    !endsAt ||
    !rawRut ||
    !fullName ||
    !phone ||
    !email
  ) {
    return { error: "Por favor completa todos los campos del formulario." };
  }

  // 2. Validación estricta de RUT chileno (Módulo 11)
  if (!validateRut(rawRut)) {
    return {
      error:
        "El RUT chileno ingresado no es válido. Por favor verifica el número y el dígito verificador.",
    };
  }

  // Rate Limiting anti-spam por RUT (máximo 5 reservas en 60 segundos)
  const rl = checkRateLimit(`booking_${rawRut}`, 5, 60);
  if (!rl.allowed) {
    return {
      error: `Has realizado demasiados intentos en poco tiempo. Por favor espera ${rl.resetInSeconds} segundos antes de volver a intentar.`,
    };
  }

  // 3. Validación de teléfono chileno
  if (!isValidChileanPhone(phone)) {
    return {
      error:
        "El número de teléfono móvil ingresado no es válido. Ingresa un número chileno de 9 dígitos (ej. +56 9 1234 5678).",
    };
  }

  const formattedRut = formatRut(rawRut);
  const normalizedPhone = normalizeChileanPhone(phone);
  const finalPrice = isNaN(rawPrice) || rawPrice < 0 ? 0 : rawPrice;

  // 4. Crear o actualizar la ficha del cliente en el negocio por RUT
  const { data: client, error: clientError }: any = await supabase
    .from("clients")
    .upsert(
      {
        business_id: businessId,
        rut: formattedRut,
        full_name: fullName,
        phone: normalizedPhone,
        email,
        consent_given: true,
        consent_date: new Date().toISOString(),
      },
      { onConflict: "business_id,rut" }
    )
    .select("id")
    .single();

  if (clientError || !client) {
    return {
      error:
        "Hubo un problema al registrar tus datos de cliente. Intenta nuevamente.",
    };
  }

  // Generar token único de cancelación / gestión
  const cancelToken =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  // 5. Insertar la cita en la base de datos
  // Aquí la restricción de exclusión física PostgreSQL (btree_gist) previene cualquier colisión
  const { data: appointment, error: aptError }: any = await supabase
    .from("appointments")
    .insert({
      business_id: businessId,
      branch_id: branchId,
      professional_id: professionalId,
      service_variant_id: serviceVariantId,
      client_id: client.id,
      starts_at: startsAt,
      ends_at: endsAt,
      status: "confirmed",
      total_price_clp: finalPrice,
      source: "online",
      client_notes: clientNotes,
      cancel_token: cancelToken,
    })
    .select("id, starts_at, ends_at, total_price_clp, cancel_token")
    .single();

  if (aptError) {
    // Si la restricción de exclusión física salta:
    if (
      aptError.code === "23P01" ||
      aptError.message?.includes("no_overlapping_active_appointments")
    ) {
      return {
        error:
          "Lo sentimos, ese horario acaba de ser reservado por otro cliente hace unos instantes. Por favor selecciona otro horario disponible.",
      };
    }
    return {
      error:
        aptError.message || "Ocurrió un error al confirmar tu reserva. Intenta nuevamente.",
    };
  }

  // Incrementar uso del cupón si se aplicó
  if (couponCode) {
    const { data: c }: any = await supabase
      .from("coupons")
      .select("id, uses_count")
      .eq("business_id", businessId)
      .eq("code", couponCode.toUpperCase())
      .maybeSingle();

    if (c) {
      await supabase
        .from("coupons")
        .update({ uses_count: (c.uses_count || 0) + 1 })
        .eq("id", c.id);
    }
  }

  // Consultar nombres legibles para el resumen
  const [{ data: prof }, { data: variant }, { data: biz }] = await Promise.all([
    supabase.from("professionals").select("name").eq("id", professionalId).single(),
    supabase.from("service_variants").select("name, services(name)").eq("id", serviceVariantId).single(),
    supabase.from("businesses").select("name, brand_color, address").eq("id", businessId).single(),
  ]);

  const serviceName = (variant as any)?.services?.name
    ? `${(variant as any).services.name} (${(variant as any).name})`
    : (variant as any)?.name || "Servicio";

  // Disparar correo de confirmación automático (Resend)
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const manageUrl = `${appUrl}/reserva/${appointment.cancel_token}`;

    await sendNotificationEmail({
      businessId,
      appointmentId: appointment.id,
      triggerEvent: "confirmation",
      recipientEmail: email,
      brandColor: (biz as any)?.brand_color || "#ec4899",
      variables: {
        nombre: fullName,
        servicio: serviceName,
        profesional: (prof as any)?.name || "Profesional",
        fecha: formatChileanDate(appointment.starts_at),
        hora: formatChileanTime(appointment.starts_at),
        direccion: (biz as any)?.address || "Dirección del local",
        enlace_gestion: manageUrl,
        negocio: (biz as any)?.name || "RESERVAPP",
        precio: formatCLP(appointment.total_price_clp),
      },
    });
  } catch (emailErr) {
    console.error("No se pudo enviar correo de confirmación:", emailErr);
  }

  return {
    success: true,
    appointment: {
      id: appointment.id,
      cancel_token: appointment.cancel_token,
      starts_at: appointment.starts_at,
      ends_at: appointment.ends_at,
      total_price_clp: appointment.total_price_clp,
      professional_name: (prof as any)?.name || "Profesional",
      service_name: serviceName,
      client_name: fullName,
      client_phone: normalizedPhone,
    },
  };
}

/**
 * Registro de un cliente en lista de espera cuando no encuentra horas disponibles
 */
export async function joinWaitlistAction(formData: FormData) {
  const supabase = await createClient();

  const businessId = formData.get("business_id") as string;
  const serviceVariantId = formData.get("service_variant_id") as string;
  const professionalId = (formData.get("professional_id") as string) || null;
  const startDate = formData.get("preferred_date_start") as string;
  const endDate = (formData.get("preferred_date_end") as string) || startDate;
  const rawRut = (formData.get("rut") as string)?.trim();
  const fullName = (formData.get("full_name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!businessId || !serviceVariantId || !rawRut || !fullName || !phone || !email || !startDate) {
    return { error: "Por favor completa todos los campos requeridos." };
  }

  if (!validateRut(rawRut)) {
    return { error: "El RUT ingresado no es válido." };
  }

  // Rate Limiting lista de espera
  const rlWaitlist = checkRateLimit(`waitlist_${rawRut}`, 4, 60);
  if (!rlWaitlist.allowed) {
    return {
      error: `Has enviado varias solicitudes recientemente. Por favor espera ${rlWaitlist.resetInSeconds} segundos.`,
    };
  }

  const formattedRut = formatRut(rawRut);
  const normalizedPhone = normalizeChileanPhone(phone);

  // Crear/actualizar cliente
  const { data: client, error: cErr }: any = await supabase
    .from("clients")
    .upsert(
      {
        business_id: businessId,
        rut: formattedRut,
        full_name: fullName,
        phone: normalizedPhone,
        email,
        consent_given: true,
      },
      { onConflict: "business_id,rut" }
    )
    .select("id")
    .single();

  if (cErr || !client) {
    return { error: "Error al registrar tus datos." };
  }

  const { error: wErr } = await supabase.from("waitlist").insert({
    business_id: businessId,
    client_id: client.id,
    service_variant_id: serviceVariantId,
    professional_id: professionalId || null,
    preferred_date_start: startDate,
    preferred_date_end: endDate,
    status: "waiting",
    notes,
  });

  if (wErr) return { error: wErr.message };

  return {
    success: true,
    message: "¡Te has anotado en la lista de espera! Te contactaremos si se libera un cupo.",
  };
}
