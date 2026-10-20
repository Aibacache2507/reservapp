import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CalendarView } from "./calendar-view";

export default async function AdminCalendarPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Obtener membresía del usuario
  const { data: member }: any = await supabase
    .from("business_members")
    .select("business_id, role, businesses(*)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!member || !member.businesses) {
    redirect("/admin/onboarding");
  }

  const businessId = member.business_id;
  const currentRole = member.role || "professional";

  // Si es estilista/profesional, buscar su ID en la tabla professionals
  let loggedProfessionalId: string | null = null;
  if (currentRole === "professional") {
    const { data: prof }: any = await supabase
      .from("professionals")
      .select("id")
      .eq("business_id", businessId)
      .eq("user_id", user.id)
      .maybeSingle();

    loggedProfessionalId = prof?.id || null;
  }

  // 2. Consultar citas, servicios, sucursales y bloqueos
  let aptsQuery = supabase
    .from("appointments")
    .select("*, clients(*), service_variants(*), professionals(*)")
    .eq("business_id", businessId)
    .order("starts_at", { ascending: true });

  // Si el rol es solo profesional, restringir la consulta a sus propias citas
  if (currentRole === "professional" && loggedProfessionalId) {
    aptsQuery = aptsQuery.eq("professional_id", loggedProfessionalId);
  }

  const [
    { data: appointments },
    { data: professionals },
    { data: branches },
    { data: services },
    { data: variants },
    { data: scheduleBlocks },
  ]: any = await Promise.all([
    aptsQuery,
    supabase.from("professionals").select("*").eq("business_id", businessId).eq("is_active", true),
    supabase.from("branches").select("*").eq("business_id", businessId).eq("is_active", true),
    supabase.from("services").select("*").eq("business_id", businessId).eq("is_active", true),
    supabase.from("service_variants").select("*").eq("business_id", businessId).eq("is_active", true),
    supabase.from("schedule_blocks").select("*").eq("business_id", businessId),
  ]);

  const servicesWithVariants = (services || []).map((srv: any) => ({
    ...srv,
    service_variants: (variants || []).filter((v: any) => v.service_id === srv.id),
  }));

  return (
    <CalendarView
      business={member.businesses}
      appointments={appointments || []}
      professionals={professionals || []}
      branches={branches || []}
      services={servicesWithVariants}
      scheduleBlocks={scheduleBlocks || []}
      currentRole={currentRole}
      loggedProfessionalId={loggedProfessionalId}
    />
  );
}
