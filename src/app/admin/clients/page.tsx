import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientsView } from "./clients-view";

export default async function AdminClientsPage() {
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

  // Consultar clientes, fichas técnicas y citas
  const [
    { data: clients },
    { data: clientRecords },
    { data: appointments },
  ]: any = await Promise.all([
    supabase
      .from("clients")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false }),
    supabase
      .from("client_records")
      .select("*")
      .eq("business_id", businessId),
    supabase
      .from("appointments")
      .select("*, service_variants(*)")
      .eq("business_id", businessId)
      .order("starts_at", { ascending: false }),
  ]);

  return (
    <ClientsView
      business={member.businesses}
      clients={clients || []}
      clientRecords={clientRecords || []}
      appointments={appointments || []}
    />
  );
}
