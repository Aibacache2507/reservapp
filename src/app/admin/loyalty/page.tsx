import * as React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoyaltyView } from "./loyalty-view";

export default async function AdminLoyaltyPage() {
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

  if (member.role === "professional") {
    redirect("/admin/calendar");
  }

  // 1. Clientes y sus citas completadas para ranking de fidelidad (LTV)
  const { data: clientsData } = await supabase
    .from("clients")
    .select(`
      id,
      name,
      rut,
      phone,
      email,
      appointments (
        id,
        status,
        total_price_clp,
        starts_at
      )
    `)
    .eq("business_id", business.id);

  const frequentClients = (clientsData || [])
    .map((client: any) => {
      const completedApts = (client.appointments || []).filter(
        (a: any) => a.status === "completed"
      );
      const totalSpentClp = completedApts.reduce(
        (sum: number, a: any) => sum + (Number(a.total_price_clp) || 0),
        0
      );
      const sortedByDate = [...completedApts].sort(
        (a: any, b: any) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()
      );
      const lastVisitDate = sortedByDate[0]?.starts_at || null;

      return {
        id: client.id,
        name: client.name,
        rut: client.rut,
        phone: client.phone,
        email: client.email,
        totalVisits: completedApts.length,
        totalSpentClp,
        lastVisitDate,
      };
    })
    .filter((c: any) => c.totalVisits > 0)
    .sort((a: any, b: any) => b.totalSpentClp - a.totalSpentClp);

  // 2. Reseñas del negocio
  const { data: reviews } = await supabase
    .from("reviews")
    .select(`
      id,
      business_id,
      rating,
      comment,
      is_public,
      business_reply,
      reply_at,
      created_at,
      clients (
        name,
        rut
      ),
      professionals (
        name
      )
    `)
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  // 3. Packs del negocio
  const { data: packs } = await supabase
    .from("packs")
    .select("*")
    .eq("business_id", business.id);

  return (
    <LoyaltyView
      business={business}
      frequentClients={frequentClients}
      reviews={(reviews as any) || []}
      packs={packs || []}
    />
  );
}
