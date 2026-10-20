import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsView } from "./settings-view";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Obtener negocio activo del usuario
  const { data: member }: any = await supabase
    .from("business_members")
    .select("business_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!member) {
    redirect("/admin/onboarding");
  }

  const businessId = member.business_id;

  // Consultar todas las entidades del negocio en paralelo
  const [
    { data: business },
    { data: branches },
    { data: categories },
    { data: services },
    { data: variants },
    { data: professionals },
    { data: profServices },
    { data: workingHours },
    { data: timeOffList },
    { data: messageTemplates },
  ] = await Promise.all([
    supabase.from("businesses").select("*").eq("id", businessId).single(),
    supabase.from("branches").select("*").eq("business_id", businessId).order("is_main", { ascending: false }),
    supabase.from("service_categories").select("*").eq("business_id", businessId).order("display_order"),
    supabase.from("services").select("*").eq("business_id", businessId).order("display_order"),
    supabase.from("service_variants").select("*").eq("business_id", businessId).order("display_order"),
    supabase.from("professionals").select("*").eq("business_id", businessId).order("display_order"),
    supabase.from("professional_services").select("*").eq("business_id", businessId),
    supabase.from("working_hours").select("*").eq("business_id", businessId).order("day_of_week"),
    supabase.from("time_off").select("*").eq("business_id", businessId).order("start_date", { ascending: false }),
    supabase.from("message_templates").select("*").eq("business_id", businessId),
  ]);

  if (!business) {
    redirect("/admin/onboarding");
  }

  // Anidar variantes en sus respectivos servicios para una UI limpia
  const servicesWithVariants = ((services as any[]) || []).map((srv: any) => ({
    ...srv,
    service_variants: ((variants as any[]) || []).filter((v: any) => v.service_id === srv.id),
  }));

  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-neutral-500">Cargando configuración...</div>}>
      <SettingsView
        business={business}
        branches={branches || []}
        categories={categories || []}
        services={servicesWithVariants}
        professionals={professionals || []}
        professionalServices={profServices || []}
        workingHours={workingHours || []}
        timeOffList={timeOffList || []}
        messageTemplates={messageTemplates || []}
      />
    </Suspense>
  );
}
