"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeChileanPhone, cleanPhoneForWhatsApp } from "@/lib/utils/chile";
import { sanitizeSlug } from "@/app/admin/onboarding/actions";

export interface ActionResult {
  success?: boolean;
  message?: string;
  error?: string;
}

/**
 * Obtiene el ID del negocio activo para el usuario autenticado
 */
export async function getActiveBusinessId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: member } = await supabase
    .from("business_members")
    .select("business_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return member?.business_id || null;
}

/**
 * Actualiza la información general del negocio
 */
export async function updateBusinessGeneral(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const businessId = await getActiveBusinessId();
  if (!businessId) return { error: "No se encontró el negocio activo." };

  const name = (formData.get("name") as string)?.trim();
  const rawSlug = (formData.get("slug") as string)?.trim();
  const rubro = (formData.get("rubro") as string)?.trim();
  const brandColor = (formData.get("brand_color") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const whatsappNumber = (formData.get("whatsapp_number") as string)?.trim();
  const address = (formData.get("address") as string)?.trim();
  const city = (formData.get("city") as string)?.trim();

  if (!name || !rawSlug || !phone || !address) {
    return { error: "Por favor completa todos los campos requeridos." };
  }

  const cleanSlug = await sanitizeSlug(rawSlug);

  // Verificar si otro negocio usa este slug
  const { data: existing } = await supabase
    .from("businesses")
    .select("id")
    .eq("slug", cleanSlug)
    .neq("id", businessId)
    .maybeSingle();

  if (existing) {
    return { error: `El slug /${cleanSlug} ya está en uso por otro negocio.` };
  }

  const { error } = await supabase
    .from("businesses")
    .update({
      name,
      slug: cleanSlug,
      rubro,
      brand_color: brandColor,
      phone: normalizeChileanPhone(phone),
      whatsapp_number: cleanPhoneForWhatsApp(whatsappNumber),
      address,
      city,
      updated_at: new Date().toISOString(),
    })
    .eq("id", businessId);

  if (error) return { error: error.message };

  revalidatePath("/admin/settings");
  return { success: true, message: "Datos del negocio actualizados con éxito." };
}

/**
 * Actualiza las reglas de agendamiento y reserva del negocio
 */
export async function updateBookingRules(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const businessId = await getActiveBusinessId();
  if (!businessId) return { error: "No se encontró el negocio activo." };

  const minAdvanceHours = parseInt(formData.get("min_advance_hours") as string, 10) || 2;
  const maxAdvanceDays = parseInt(formData.get("max_advance_days") as string, 10) || 60;
  const cancellationLimitHours = parseInt(formData.get("cancellation_limit_hours") as string, 10) || 24;
  const maxReschedules = parseInt(formData.get("max_reschedules") as string, 10) || 2;
  const slotIntervalMinutes = parseInt(formData.get("slot_interval_minutes") as string, 10) || 15;
  const noShowPolicy = (formData.get("no_show_policy") as string)?.trim();

  const bookingRules = {
    min_advance_hours: minAdvanceHours,
    max_advance_days: maxAdvanceDays,
    cancellation_limit_hours: cancellationLimitHours,
    max_reschedules: maxReschedules,
    slot_interval_minutes: slotIntervalMinutes,
    require_deposit: false,
    deposit_percentage: 0,
    no_show_policy:
      noShowPolicy ||
      "Si no asistes a tu cita o cancelas fuera de plazo, tu próxima reserva requerirá confirmación telefónica.",
  };

  const { error } = await supabase
    .from("businesses")
    .update({
      booking_rules: bookingRules,
      updated_at: new Date().toISOString(),
    })
    .eq("id", businessId);

  if (error) return { error: error.message };

  revalidatePath("/admin/settings");
  return { success: true, message: "Reglas de reserva guardadas correctamente." };
}

/**
 * Categorías de Servicios
 */
export async function createCategory(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const businessId = await getActiveBusinessId();
  if (!businessId) return { error: "No autorizado." };

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!name) return { error: "Ingresa el nombre de la categoría." };

  const { error } = await supabase.from("service_categories").insert({
    business_id: businessId,
    name,
    description,
    is_active: true,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/settings");
  return { success: true, message: "Categoría creada." };
}

export async function deleteCategory(categoryId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const businessId = await getActiveBusinessId();
  if (!businessId) return { error: "No autorizado." };

  const { error } = await supabase
    .from("service_categories")
    .delete()
    .eq("id", categoryId)
    .eq("business_id", businessId);

  if (error) return { error: error.message };
  revalidatePath("/admin/settings");
  return { success: true, message: "Categoría eliminada." };
}

/**
 * Servicios y Variantes con precio y duración
 */
export async function createServiceWithVariant(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const businessId = await getActiveBusinessId();
  if (!businessId) return { error: "No autorizado." };

  const categoryId = formData.get("category_id") as string;
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const variantName = (formData.get("variant_name") as string)?.trim() || "Estándar";
  const durationMinutes = parseInt(formData.get("duration_minutes") as string, 10) || 30;
  const priceClp = parseInt(formData.get("price_clp") as string, 10) || 0;

  if (!name || !categoryId) return { error: "Nombre y categoría son requeridos." };

  const { data: service, error: srvError } = await supabase
    .from("services")
    .insert({
      business_id: businessId,
      category_id: categoryId,
      name,
      description,
      is_active: true,
    })
    .select("id")
    .single();

  if (srvError || !service) return { error: srvError?.message || "Error al crear servicio." };

  const { error: varError } = await supabase.from("service_variants").insert({
    business_id: businessId,
    service_id: service.id,
    name: variantName,
    duration_minutes: durationMinutes,
    price_clp: priceClp,
    is_active: true,
  });

  if (varError) return { error: varError.message };

  revalidatePath("/admin/settings");
  return { success: true, message: "Servicio y variante creados con éxito." };
}

export async function addServiceVariant(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const businessId = await getActiveBusinessId();
  if (!businessId) return { error: "No autorizado." };

  const serviceId = formData.get("service_id") as string;
  const name = (formData.get("name") as string)?.trim();
  const durationMinutes = parseInt(formData.get("duration_minutes") as string, 10);
  const priceClp = parseInt(formData.get("price_clp") as string, 10);

  if (!serviceId || !name || isNaN(durationMinutes) || isNaN(priceClp)) {
    return { error: "Completa los datos de la variante." };
  }

  const { error } = await supabase.from("service_variants").insert({
    business_id: businessId,
    service_id: serviceId,
    name,
    duration_minutes: durationMinutes,
    price_clp: priceClp,
    is_active: true,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/settings");
  return { success: true, message: "Variante agregada." };
}

export async function deleteService(serviceId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const businessId = await getActiveBusinessId();
  if (!businessId) return { error: "No autorizado." };

  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", serviceId)
    .eq("business_id", businessId);

  if (error) return { error: error.message };
  revalidatePath("/admin/settings");
  return { success: true, message: "Servicio eliminado." };
}

/**
 * Gestión de Profesionales
 */
export async function createProfessional(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const businessId = await getActiveBusinessId();
  if (!businessId) return { error: "No autorizado." };

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim() || null;
  const phone = (formData.get("phone") as string)?.trim() || null;
  const specialtiesRaw = (formData.get("specialties") as string)?.trim();
  const commissionPercentage = parseFloat(formData.get("commission_percentage") as string) || 0.0;
  const bio = (formData.get("bio") as string)?.trim() || null;

  if (!name) return { error: "El nombre del profesional es obligatorio." };

  const specialties = specialtiesRaw
    ? specialtiesRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const { data: prof, error } = await supabase
    .from("professionals")
    .insert({
      business_id: businessId,
      name,
      email,
      phone: phone ? normalizeChileanPhone(phone) : null,
      specialties,
      commission_percentage: commissionPercentage,
      bio,
      is_active: true,
    })
    .select("id")
    .single();

  if (error || !prof) return { error: error?.message || "Error al crear profesional." };

  // Crear horarios de trabajo por defecto para este profesional (Lunes a Viernes 09:30 - 19:30)
  const defaultHours = [1, 2, 3, 4, 5, 6].map((day) => ({
    business_id: businessId,
    professional_id: prof.id,
    day_of_week: day,
    start_time: "09:30:00",
    end_time: "19:30:00",
    is_active: true,
  }));

  await supabase.from("working_hours").insert(defaultHours);

  // Descanso por defecto
  const defaultBreaks = [1, 2, 3, 4, 5, 6].map((day) => ({
    business_id: businessId,
    professional_id: prof.id,
    day_of_week: day,
    start_time: "14:00:00",
    end_time: "15:00:00",
    name: "Almuerzo",
  }));

  await supabase.from("breaks").insert(defaultBreaks);

  revalidatePath("/admin/settings");
  return { success: true, message: "Profesional y horarios iniciales creados con éxito." };
}

/**
 * Asignar servicio a un profesional (con precio o duración personalizada opcional)
 */
export async function toggleProfessionalService(
  professionalId: string,
  serviceVariantId: string,
  enable: boolean
): Promise<ActionResult> {
  const supabase = await createClient();
  const businessId = await getActiveBusinessId();
  if (!businessId) return { error: "No autorizado." };

  if (enable) {
    const { error } = await supabase.from("professional_services").upsert({
      business_id: businessId,
      professional_id: professionalId,
      service_variant_id: serviceVariantId,
      is_active: true,
    });
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("professional_services")
      .delete()
      .eq("professional_id", professionalId)
      .eq("service_variant_id", serviceVariantId);
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/settings");
  return { success: true };
}

/**
 * Guardar Horarios de Trabajo de un Profesional
 */
export async function updateWorkingHours(
  professionalId: string,
  hoursList: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
  }>
): Promise<ActionResult> {
  const supabase = await createClient();
  const businessId = await getActiveBusinessId();
  if (!businessId) return { error: "No autorizado." };

  // Eliminar previos
  await supabase
    .from("working_hours")
    .delete()
    .eq("business_id", businessId)
    .eq("professional_id", professionalId);

  // Insertar nuevos
  const records = hoursList.map((h) => ({
    business_id: businessId,
    professional_id: professionalId,
    day_of_week: h.day_of_week,
    start_time: h.start_time,
    end_time: h.end_time,
    is_active: h.is_active,
  }));

  const { error } = await supabase.from("working_hours").insert(records);
  if (error) return { error: error.message };

  revalidatePath("/admin/settings");
  return { success: true, message: "Horarios actualizados correctamente." };
}

/**
 * Registrar Vacaciones / Día Libre (Time Off)
 */
export async function createTimeOff(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const businessId = await getActiveBusinessId();
  if (!businessId) return { error: "No autorizado." };

  const professionalId = formData.get("professional_id") as string;
  const startDate = formData.get("start_date") as string;
  const endDate = (formData.get("end_date") as string) || startDate;
  const reason = (formData.get("reason") as string)?.trim() || "Día Libre / Vacaciones";

  if (!professionalId || !startDate) {
    return { error: "Selecciona el profesional y la fecha de inicio." };
  }

  const { error } = await supabase.from("time_off").insert({
    business_id: businessId,
    professional_id: professionalId,
    start_date: startDate,
    end_date: endDate,
    reason,
    is_all_day: true,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/settings");
  return { success: true, message: "Período libre o vacaciones registrado." };
}
