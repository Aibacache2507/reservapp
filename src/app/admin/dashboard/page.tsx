import * as React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardView } from "./dashboard-view";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: member }: any = await supabase
    .from("business_members")
    .select("role, business_id, businesses(*)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!member || !member.businesses) {
    redirect("/admin/onboarding");
  }

  const business = member.businesses as any;

  // Si es un profesional regular, redirigir a su agenda
  if (member.role === "professional") {
    redirect("/admin/calendar");
  }

  // Consultar todas las citas del negocio con información de servicio y profesional
  const { data: appointments } = await supabase
    .from("appointments")
    .select(`
      id,
      starts_at,
      ends_at,
      status,
      total_price_clp,
      service_id,
      professional_id,
      services (name),
      professionals (name, commission_percentage)
    `)
    .eq("business_id", business.id)
    .order("starts_at", { ascending: false });

  return (
    <DashboardView
      business={business}
      appointments={(appointments as any) || []}
    />
  );
}
