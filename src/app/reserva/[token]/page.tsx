import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ManageView } from "./manage-view";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ManageBookingPage({ params }: PageProps) {
  const { token } = await params;
  const supabase = await createClient();

  // Consultar la cita por su token único
  const { data: appointment }: any = await supabase
    .from("appointments")
    .select("*, businesses(*), professionals(*), service_variants(*), clients(*)")
    .eq("cancel_token", token)
    .single();

  if (!appointment) {
    notFound();
  }

  return (
    <ManageView
      appointment={appointment}
      business={appointment.businesses}
      professional={appointment.professionals}
      variant={appointment.service_variants}
      client={appointment.clients}
    />
  );
}
