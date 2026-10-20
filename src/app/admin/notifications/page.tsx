import * as React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NotificationsView } from "./notifications-view";

export default async function AdminNotificationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Obtener negocio y rol del miembro
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

  // Rango para citas de hoy y próximos 2 días
  const now = new Date();
  const twoDaysLater = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();

  // 1. Citas activas para notificar por WhatsApp
  const { data: rawAppointments } = await supabase
    .from("appointments")
    .select(`
      id,
      business_id,
      starts_at,
      ends_at,
      status,
      total_price_clp,
      access_token,
      clients (
        name,
        phone,
        email
      ),
      professionals (
        name
      ),
      services (
        name
      )
    `)
    .eq("business_id", business.id)
    .in("status", ["pending", "confirmed"])
    .gte("starts_at", now.toISOString())
    .lte("starts_at", twoDaysLater)
    .order("starts_at", { ascending: true });

  // 2. Historial de WhatsApp manual ya enviados para no duplicar en la cola
  const { data: waSentLogs } = await supabase
    .from("notifications_log")
    .select("appointment_id")
    .eq("business_id", business.id)
    .eq("channel", "whatsapp_manual")
    .eq("status", "sent");

  const sentApptIds = new Set(waSentLogs?.map((l) => l.appointment_id).filter(Boolean));

  // Filtrar y enriquecer citas pendientes
  const pendingAppointments = (rawAppointments || [])
    .filter((appt: any) => !sentApptIds.has(appt.id))
    .map((appt: any) => {
      const apptStart = new Date(appt.starts_at).getTime();
      const diffHours = (apptStart - now.getTime()) / (1000 * 60 * 60);

      let suggestedTrigger: "reminder_24h" | "reminder_2h" | "confirmation" = "reminder_24h";
      if (diffHours <= 3) {
        suggestedTrigger = "reminder_2h";
      } else if (appt.status === "pending") {
        suggestedTrigger = "confirmation";
      }

      return {
        ...appt,
        suggestedTrigger,
      };
    });

  // 3. Plantillas personalizadas del negocio
  const { data: templates } = await supabase
    .from("message_templates")
    .select("*")
    .eq("business_id", business.id);

  // 4. Historial reciente de notificaciones (ambos canales)
  const { data: historyLogs } = await supabase
    .from("notifications_log")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <NotificationsView
      business={business}
      pendingAppointments={pendingAppointments as any}
      templates={templates || []}
      historyLogs={historyLogs || []}
    />
  );
}
