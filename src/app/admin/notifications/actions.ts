"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendNotificationEmail } from "@/lib/notifications/email";

export interface NotificationActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Marca un mensaje de WhatsApp como enviado manualmente para evitar duplicarlo.
 */
export async function markWhatsAppSent(formData: FormData): Promise<NotificationActionResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Debes iniciar sesión para realizar esta acción." };
    }

    const businessId = formData.get("business_id") as string;
    const appointmentId = (formData.get("appointment_id") as string) || null;
    const triggerEvent = (formData.get("trigger_event") as string) || "reminder";
    const recipient = formData.get("recipient") as string;
    const messageBody = formData.get("body") as string;

    if (!businessId || !recipient) {
      return { success: false, error: "Faltan datos obligatorios para el registro." };
    }

    // Insertar registro en notifications_log
    const { error } = await supabase.from("notifications_log").insert({
      business_id: businessId,
      appointment_id: appointmentId,
      channel: "whatsapp_manual",
      recipient: recipient,
      subject: `WhatsApp Manual: ${triggerEvent}`,
      body: messageBody || "Mensaje enviado vía WhatsApp",
      status: "sent",
      attempts: 1,
      sent_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error al registrar notificación WhatsApp:", error);
      return { success: false, error: "No se pudo registrar el envío del mensaje." };
    }

    revalidatePath("/admin/notifications");
    return { success: true, message: "Mensaje marcado como enviado correctamente." };
  } catch (err: any) {
    console.error("Excepción en markWhatsAppSent:", err);
    return { success: false, error: err.message || "Error al procesar la solicitud." };
  }
}

/**
 * Guarda o actualiza una plantilla personalizada de mensajes para el negocio.
 */
export async function saveMessageTemplate(formData: FormData): Promise<NotificationActionResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Debes iniciar sesión para guardar plantillas." };
    }

    const businessId = formData.get("business_id") as string;
    const triggerEvent = formData.get("trigger_event") as string;
    const channel = formData.get("channel") as "whatsapp_manual" | "email";
    const subject = (formData.get("subject") as string) || null;
    const body = formData.get("body") as string;

    if (!businessId || !triggerEvent || !channel || !body) {
      return { success: false, error: "Todos los campos obligatorios deben completarse." };
    }

    const { error } = await supabase.from("message_templates").upsert(
      {
        business_id: businessId,
        trigger_event: triggerEvent,
        channel: channel,
        subject: subject,
        body: body,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "business_id,trigger_event,channel" }
    );

    if (error) {
      console.error("Error al guardar plantilla:", error);
      return { success: false, error: "No se pudo guardar la plantilla en base de datos." };
    }

    revalidatePath("/admin/notifications");
    return { success: true, message: "Plantilla personalizada guardada con éxito." };
  } catch (err: any) {
    console.error("Excepción en saveMessageTemplate:", err);
    return { success: false, error: err.message || "Error al procesar la plantilla." };
  }
}

/**
 * Permite enviar un correo de prueba con la plantilla actual a cualquier dirección.
 */
export async function sendTestEmailAction(formData: FormData): Promise<NotificationActionResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "No autorizado" };
    }

    const businessId = formData.get("business_id") as string;
    const recipientEmail = formData.get("recipient_email") as string;
    const triggerEvent = (formData.get("trigger_event") as any) || "confirmation";
    const customSubject = formData.get("subject") as string;
    const customBody = formData.get("body") as string;

    if (!businessId || !recipientEmail) {
      return { success: false, error: "Ingresa un correo electrónico de destino válido." };
    }

    const { data: business }: any = await supabase
      .from("businesses")
      .select("name, brand_color, address")
      .eq("id", businessId)
      .single();

    const res = await sendNotificationEmail({
      businessId,
      triggerEvent,
      recipientEmail,
      customSubject,
      customBody,
      brandColor: business?.brand_color || "#ec4899",
      variables: {
        nombre: "María Paz (Prueba)",
        servicio: "Corte y Peinado Premium",
        profesional: "Camila Silva",
        fecha: "Viernes 24 de Octubre",
        hora: "16:30",
        direccion: business?.address || "Av. Providencia 2133, Santiago",
        enlace_gestion: "https://reservapp.cl/reserva/demo_token",
        negocio: business?.name || "Salón Demo",
        precio: "$25.000",
      },
    });

    if (!res.success) {
      return { success: false, error: res.error || "No se pudo enviar el correo de prueba." };
    }

    revalidatePath("/admin/notifications");
    return {
      success: true,
      message: res.simulated
        ? "Correo simulado con éxito (modo desarrollo sin clave Resend)."
        : "¡Correo de prueba enviado con éxito vía Resend!",
    };
  } catch (err: any) {
    console.error("Excepción en sendTestEmailAction:", err);
    return { success: false, error: err.message || "Error al enviar correo de prueba." };
  }
}
