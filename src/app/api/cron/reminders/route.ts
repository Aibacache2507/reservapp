import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendNotificationEmail } from "@/lib/notifications/email";
import { formatChileanDate, formatChileanTime } from "@/lib/utils/dates";
import { formatCLP } from "@/lib/utils/chile";

export const dynamic = "force-dynamic";

/**
 * Endpoint de Cron Automatizado para Recordatorios y Notificaciones.
 * Diseñado para ser ejecutado periódicamente (ej. cada 15 minutos)
 * mediante Supabase pg_cron o Vercel Cron.
 */
export async function GET(request: NextRequest) {
  try {
    // Verificación opcional de token secreto para proteger el endpoint
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const supabase = await createClient();
    const now = new Date();

    let processedCount = 0;
    let sentCount = 0;
    let errorsCount = 0;

    // =========================================================================
    // 1. RECORDATORIOS DE 24 HORAS (Citas entre ahora + 23h y ahora + 25h)
    // =========================================================================
    const window24hStart = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString();
    const window24hEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();

    const { data: appts24h, error: err24h } = await supabase
      .from("appointments")
      .select(`
        id,
        business_id,
        starts_at,
        ends_at,
        total_price_clp,
        access_token,
        clients(name, email, phone),
        professionals(name),
        services(name),
        businesses(name, brand_color, address, slug)
      `)
      .in("status", ["pending", "confirmed"])
      .gte("starts_at", window24hStart)
      .lte("starts_at", window24hEnd);

    if (err24h) {
      console.error("Error al consultar citas para 24h:", err24h);
    } else if (appts24h) {
      for (const appt of appts24h) {
        processedCount++;
        const client = appt.clients as any;
        const biz = appt.businesses as any;
        const prof = appt.professionals as any;
        const srv = appt.services as any;

        if (!client?.email) continue;

        // Verificar si ya se envió el recordatorio de 24h
        const { data: existingLog } = await supabase
          .from("notifications_log")
          .select("id")
          .eq("appointment_id", appt.id)
          .eq("channel", "email")
          .ilike("subject", "%Recordatorio: Mañana%")
          .limit(1)
          .maybeSingle();

        if (existingLog) continue; // Ya enviado

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const manageUrl = `${appUrl}/reserva/${appt.access_token}`;

        const res = await sendNotificationEmail({
          businessId: appt.business_id,
          appointmentId: appt.id,
          triggerEvent: "reminder_24h",
          recipientEmail: client.email,
          brandColor: biz?.brand_color || "#ec4899",
          variables: {
            nombre: client.name,
            servicio: srv?.name || "Servicio",
            profesional: prof?.name || "Especialista",
            fecha: formatChileanDate(appt.starts_at),
            hora: formatChileanTime(appt.starts_at),
            direccion: biz?.address || "Dirección del local",
            enlace_gestion: manageUrl,
            negocio: biz?.name || "RESERVAPP",
            precio: formatCLP(appt.total_price_clp || 0),
          },
        });

        if (res.success) sentCount++;
        else errorsCount++;
      }
    }

    // =========================================================================
    // 2. RECORDATORIOS DE 2 HORAS (Citas entre ahora + 1h45m y ahora + 2h15m)
    // =========================================================================
    const window2hStart = new Date(now.getTime() + 105 * 60 * 1000).toISOString();
    const window2hEnd = new Date(now.getTime() + 135 * 60 * 1000).toISOString();

    const { data: appts2h, error: err2h } = await supabase
      .from("appointments")
      .select(`
        id,
        business_id,
        starts_at,
        ends_at,
        total_price_clp,
        access_token,
        clients(name, email, phone),
        professionals(name),
        services(name),
        businesses(name, brand_color, address, slug)
      `)
      .in("status", ["pending", "confirmed"])
      .gte("starts_at", window2hStart)
      .lte("starts_at", window2hEnd);

    if (err2h) {
      console.error("Error al consultar citas para 2h:", err2h);
    } else if (appts2h) {
      for (const appt of appts2h) {
        processedCount++;
        const client = appt.clients as any;
        const biz = appt.businesses as any;
        const prof = appt.professionals as any;
        const srv = appt.services as any;

        if (!client?.email) continue;

        // Verificar si ya se envió el recordatorio de 2h
        const { data: existingLog } = await supabase
          .from("notifications_log")
          .select("id")
          .eq("appointment_id", appt.id)
          .eq("channel", "email")
          .ilike("subject", "%2 horas%")
          .limit(1)
          .maybeSingle();

        if (existingLog) continue;

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const manageUrl = `${appUrl}/reserva/${appt.access_token}`;

        const res = await sendNotificationEmail({
          businessId: appt.business_id,
          appointmentId: appt.id,
          triggerEvent: "reminder_2h",
          recipientEmail: client.email,
          brandColor: biz?.brand_color || "#ec4899",
          variables: {
            nombre: client.name,
            servicio: srv?.name || "Servicio",
            profesional: prof?.name || "Especialista",
            fecha: formatChileanDate(appt.starts_at),
            hora: formatChileanTime(appt.starts_at),
            direccion: biz?.address || "Dirección del local",
            enlace_gestion: manageUrl,
            negocio: biz?.name || "RESERVAPP",
            precio: formatCLP(appt.total_price_clp || 0),
          },
        });

        if (res.success) sentCount++;
        else errorsCount++;
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      processedCount,
      sentCount,
      errorsCount,
    });
  } catch (error: any) {
    console.error("Excepción en Cron de Notificaciones:", error);
    return NextResponse.json(
      { error: error.message || "Error procesando recordatorios" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
