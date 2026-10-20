import * as React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InventoryView } from "./inventory-view";

export default async function AdminInventoryPage() {
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

  // 1. Consultar productos del inventario
  const { data: items } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("business_id", business.id)
    .order("name", { ascending: true });

  // 2. Consultar últimos 50 movimientos
  const { data: movements } = await supabase
    .from("inventory_movements")
    .select(`
      id,
      business_id,
      item_id,
      movement_type,
      quantity,
      unit_cost_clp,
      reason,
      created_at,
      inventory_items (
        name
      )
    `)
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <InventoryView
      business={business}
      items={(items as any) || []}
      movements={(movements as any) || []}
    />
  );
}
