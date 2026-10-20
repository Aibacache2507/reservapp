"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeChileanPhone, cleanPhoneForWhatsApp } from "@/lib/utils/chile";

export interface OnboardingState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Normaliza un texto para generar un slug válido (ej. "Salón Providencia!" -> "salon-providencia")
 */
export async function sanitizeSlug(text: string): Promise<string> {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remueve acentos
    .replace(/[^a-z0-9]+/g, "-") // Reemplaza caracteres no alfanuméricos por guión
    .replace(/^-+|-+$/g, ""); // Remueve guiones al inicio y fin
}

export async function createBusinessOnboarding(
  prevState: OnboardingState | null,
  formData: FormData
): Promise<OnboardingState> {
  const supabase = await createClient();

  // Verificar usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const name = (formData.get("name") as string)?.trim();
  const rawSlug = (formData.get("slug") as string)?.trim();
  const rubro = (formData.get("rubro") as string)?.trim() || "belleza_y_estetica";
  const brandColor = (formData.get("brand_color") as string)?.trim() || "#ec4899";
  const logoUrl = (formData.get("logo_url") as string)?.trim() || null;
  const phone = (formData.get("phone") as string)?.trim();
  const whatsappNumber = (formData.get("whatsapp_number") as string)?.trim() || phone;
  const address = (formData.get("address") as string)?.trim();
  const city = (formData.get("city") as string)?.trim() || "Santiago";
  const branchName = (formData.get("branch_name") as string)?.trim() || "Casa Central";

  if (!name || !rawSlug || !phone || !address) {
    return { error: "Por favor completa todos los campos obligatorios." };
  }

  const cleanSlug = await sanitizeSlug(rawSlug);
  if (cleanSlug.length < 3) {
    return { error: "El enlace (slug) debe tener al menos 3 caracteres alfanuméricos." };
  }

  // Verificar si el slug ya está en uso
  const { data: existingBusiness } = await supabase
    .from("businesses")
    .select("id")
    .eq("slug", cleanSlug)
    .maybeSingle();

  if (existingBusiness) {
    return {
      error: `El enlace /${cleanSlug} ya está registrado por otro negocio. Prueba con otro slug.`,
    };
  }

  const normalizedPhone = normalizeChileanPhone(phone);
  const cleanWhatsApp = cleanPhoneForWhatsApp(whatsappNumber);

  // 1. Crear el Negocio
  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .insert({
      name,
      slug: cleanSlug,
      rubro,
      brand_color: brandColor,
      logo_url: logoUrl,
      phone: normalizedPhone,
      whatsapp_number: cleanWhatsApp,
      email: user.email!,
      address,
      city,
      plan: "pro",
      status: "active",
      booking_rules: {
        min_advance_hours: 2,
        max_advance_days: 60,
        cancellation_limit_hours: 24,
        max_reschedules: 2,
        slot_interval_minutes: 15,
        require_deposit: false,
        deposit_percentage: 0,
        no_show_policy:
          "Si no asistes o cancelas con menos de 24 horas de anticipación, tu próxima reserva requerirá confirmación previa.",
      },
    })
    .select("id")
    .single();

  if (bizError || !business) {
    return { error: bizError?.message || "No fue posible crear el negocio." };
  }

  const businessId = business.id;

  // 2. Crear la Sucursal Principal
  await supabase.from("branches").insert({
    business_id: businessId,
    name: branchName,
    address,
    phone: normalizedPhone,
    is_main: true,
    is_active: true,
  });

  // 3. Vincular al Usuario como Administrador del Negocio
  await supabase.from("business_members").insert({
    business_id: businessId,
    user_id: user.id,
    role: "business_admin",
    is_active: true,
  });

  // 4. Crear un profesional inicial para el dueño si lo desea
  await supabase.from("professionals").insert({
    business_id: businessId,
    user_id: user.id,
    name: user.user_metadata?.full_name || name,
    email: user.email,
    phone: normalizedPhone,
    specialties: ["Atención General", "Especialista"],
    commission_percentage: 50.0,
    is_active: true,
    display_order: 1,
  });

  // 5. Crear categorías y servicios iniciales sugeridos
  const { data: cat } = await supabase
    .from("service_categories")
    .insert({
      business_id: businessId,
      name: "Servicios Populares",
      description: "Nuestros servicios más solicitados",
      display_order: 1,
      is_active: true,
    })
    .select("id")
    .single();

  if (cat) {
    const { data: srv } = await supabase
      .from("services")
      .insert({
        business_id: businessId,
        category_id: cat.id,
        name: "Servicio Estándar",
        description: "Servicio profesional personalizado",
        is_active: true,
        display_order: 1,
      })
      .select("id")
      .single();

    if (srv) {
      await supabase.from("service_variants").insert({
        business_id: businessId,
        service_id: srv.id,
        name: "Sesión Estándar 45 min",
        duration_minutes: 45,
        price_clp: 20000,
        is_active: true,
        display_order: 1,
      });
    }
  }

  redirect("/admin/settings");
}
