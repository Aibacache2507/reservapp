import * as React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PromotionsView } from "./promotions-view";

export default async function AdminPromotionsPage() {
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

  // Si es un profesional regular sin permisos de admin, redirigir a su agenda
  if (member.role === "professional") {
    redirect("/admin/calendar");
  }

  // Obtener cupones
  const { data: coupons } = await supabase
    .from("coupons")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  // Obtener packs
  const { data: packs } = await supabase
    .from("packs")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  return (
    <PromotionsView
      business={business}
      coupons={coupons || []}
      packs={packs || []}
    />
  );
}
