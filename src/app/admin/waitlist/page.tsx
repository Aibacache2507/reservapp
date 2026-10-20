import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WaitlistView } from "./waitlist-view";

export default async function AdminWaitlistPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: member }: any = await supabase
    .from("business_members")
    .select("business_id, businesses(*)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!member || !member.businesses) {
    redirect("/admin/onboarding");
  }

  const businessId = member.business_id;

  // Consultar lista de espera ordenada por antigüedad (primero en llegar)
  const [{ data: waitlist }, { data: recentCancelled }]: any = await Promise.all([
    supabase
      .from("waitlist")
      .select("*, clients(*), service_variants(*), professionals(*)")
      .eq("business_id", businessId)
      .order("created_at", { ascending: true }),
    supabase
      .from("appointments")
      .select("id, cancelled_at")
      .eq("business_id", businessId)
      .eq("status", "cancelled")
      .gte("cancelled_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1),
  ]);

  const hasRecentCancellations = Boolean(recentCancelled && recentCancelled.length > 0);

  return (
    <WaitlistView
      business={member.businesses}
      waitlist={waitlist || []}
      hasRecentCancellations={hasRecentCancellations}
    />
  );
}
