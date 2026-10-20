import * as React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CommissionsView } from "./commissions-view";

export default async function AdminCommissionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: member }: any = await supabase
    .from("business_members")
    .select("role, business_id, professional_id, businesses(*)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!member || !member.businesses) {
    redirect("/admin/onboarding");
  }

  const business = member.businesses as any;
  const isProfessional = member.role === "professional";

  // Consultar profesionales del negocio
  const { data: professionals } = await supabase
    .from("professionals")
    .select("id, name, commission_percentage")
    .eq("business_id", business.id)
    .eq("is_active", true)
    .order("name", { ascending: true });

  // Si es profesional, buscar su ID específico
  let professionalId = member.professional_id;
  if (isProfessional && !professionalId) {
    const emailPrefix = user.email ? user.email.split("@")[0].toLowerCase() : "";
    const matched = professionals?.find(
      (p) => emailPrefix && p.name.toLowerCase().includes(emailPrefix)
    );
    if (matched) professionalId = matched.id;
  }

  // Consultar comisiones
  let query = supabase
    .from("commissions")
    .select(`
      id,
      business_id,
      professional_id,
      appointment_id,
      commission_percentage,
      total_amount_clp,
      commission_amount_clp,
      status,
      paid_at,
      created_at,
      professionals (
        name,
        commission_percentage
      ),
      appointments (
        starts_at,
        clients (
          name,
          rut
        ),
        services (
          name
        )
      )
    `)
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  if (isProfessional && professionalId) {
    query = query.eq("professional_id", professionalId);
  }

  const { data: commissions } = await query;

  return (
    <CommissionsView
      business={business}
      commissions={(commissions as any) || []}
      professionals={professionals || []}
      userRole={member.role}
      currentProfessionalId={professionalId}
    />
  );
}
