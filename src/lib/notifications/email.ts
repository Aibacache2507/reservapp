/**
 * Servicio de envío de correos electrónicos transaccionales usando Resend.
 * Incluye registro en `notifications_log` y plantillas HTML responsivas elegantes.
 */

import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_EMAIL_TEMPLATES,
  interpolateVariables,
  type MessageVariables,
} from "./templates";

const resendApiKey = process.env.RESEND_API_KEY;
const defaultFromEmail = process.env.RESEND_FROM_EMAIL || "notificaciones@reservapp.cl";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface SendEmailParams {
  businessId: string;
  appointmentId?: string;
  triggerEvent:
    | "confirmation"
    | "reminder_24h"
    | "reminder_2h"
    | "cancelled"
    | "rescheduled"
    | "waitlist_available"
    | "review_request";
  recipientEmail: string;
  variables: MessageVariables;
  customSubject?: string;
  customBody?: string;
  brandColor?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
}

/**
 * Genera el cuerpo HTML enriquecido para el correo transaccional.
 */
export function buildHtmlEmailLayout({
  title,
  bodyText,
  businessName,
  variables,
  brandColor = "#ec4899",
  ctaText = "Ver o Gestionar mi Cita",
  ctaUrl,
}: {
  title: string;
  bodyText: string;
  businessName: string;
  variables: MessageVariables;
  brandColor?: string;
  ctaText?: string;
  ctaUrl?: string;
}): string {
  const formattedBody = bodyText.replace(/\n/g, "<br />");

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Contenedor Principal -->
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <!-- Encabezado con Color de Marca -->
          <tr>
            <td style="background-color: ${brandColor}; padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                ${businessName}
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: rgba(255, 255, 255, 0.9);">
                Sistema de Agendamiento Online
              </p>
            </td>
          </tr>

          <!-- Contenido Central -->
          <tr>
            <td style="padding: 32px 28px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                ${title}
              </h2>

              <div style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
                ${formattedBody}
              </div>

              <!-- Ficha Resumen de la Cita -->
              ${
                variables.servicio || variables.fecha
                  ? `
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 28px; border-left: 4px solid ${brandColor};">
                ${
                  variables.servicio
                    ? `<tr><td style="padding: 4px 0; font-size: 14px; color: #64748b; width: 120px;"><strong>Servicio:</strong></td><td style="padding: 4px 0; font-size: 14px; font-weight: 600; color: #0f172a;">${variables.servicio}</td></tr>`
                    : ""
                }
                ${
                  variables.profesional
                    ? `<tr><td style="padding: 4px 0; font-size: 14px; color: #64748b;"><strong>Profesional:</strong></td><td style="padding: 4px 0; font-size: 14px; font-weight: 600; color: #0f172a;">${variables.profesional}</td></tr>`
                    : ""
                }
                ${
                  variables.fecha
                    ? `<tr><td style="padding: 4px 0; font-size: 14px; color: #64748b;"><strong>Fecha y Hora:</strong></td><td style="padding: 4px 0; font-size: 14px; font-weight: 600; color: #0f172a;">${variables.fecha} a las ${variables.hora || ""} hrs</td></tr>`
                    : ""
                }
                ${
                  variables.precio
                    ? `<tr><td style="padding: 4px 0; font-size: 14px; color: #64748b;"><strong>Total a pagar:</strong></td><td style="padding: 4px 0; font-size: 15px; font-weight: 700; color: #ec4899;">${variables.precio} <span style="font-size: 12px; font-weight: normal; color: #64748b;">(en el local)</span></td></tr>`
                    : ""
                }
                ${
                  variables.direccion
                    ? `<tr><td style="padding: 4px 0; font-size: 14px; color: #64748b;"><strong>Ubicación:</strong></td><td style="padding: 4px 0; font-size: 14px; color: #334155;">${variables.direccion}</td></tr>`
                    : ""
                }
              </table>
              `
                  : ""
              }

              <!-- Botón de Llamado a la Acción (CTA) -->
              ${
                ctaUrl
                  ? `
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${ctaUrl}" target="_blank" style="display: inline-block; background-color: ${brandColor}; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                      ${ctaText}
                    </a>
                  </td>
                </tr>
              </table>
              `
                  : ""
              }

              <!-- Recordatorio de Pago en el Local -->
              <p style="margin: 0; font-size: 12px; color: #64748b; text-align: center; line-height: 1.5;">
                💳 <em>Recuerda que no cobramos por adelantado. El pago se realiza directamente en el local con efectivo, débito o transferencia bancaria.</em>
              </p>
            </td>
          </tr>

          <!-- Pie de Página -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                Este correo fue enviado automáticamente por <strong>${businessName}</strong> a través de <strong>RESERVAPP</strong>.
              </p>
              <p style="margin: 6px 0 0 0; font-size: 11px; color: #cbd5e1;">
                Por favor no respondas directamente a este correo automático.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Envía un correo electrónico transaccional y lo registra en `notifications_log`.
 */
export async function sendNotificationEmail(
  params: SendEmailParams
): Promise<SendEmailResult> {
  const {
    businessId,
    appointmentId,
    triggerEvent,
    recipientEmail,
    variables,
    customSubject,
    customBody,
    brandColor = "#ec4899",
  } = params;

  const templateConfig = DEFAULT_EMAIL_TEMPLATES[triggerEvent] || {
    subject: `Notificación de ${variables.negocio || "tu cita"}`,
    body: "Tienes una nueva notificación de tu servicio.",
  };

  const rawSubject = customSubject || templateConfig.subject;
  const rawBody = customBody || templateConfig.body;

  const finalSubject = interpolateVariables(rawSubject, variables);
  const finalBody = interpolateVariables(rawBody, variables);

  const htmlContent = buildHtmlEmailLayout({
    title: finalSubject,
    bodyText: finalBody,
    businessName: variables.negocio || "RESERVAPP",
    variables,
    brandColor,
    ctaUrl: variables.enlace_gestion,
    ctaText:
      triggerEvent === "review_request"
        ? "Dejar mi Reseña ⭐"
        : triggerEvent === "waitlist_available"
        ? "Tomar Cupo Disponible"
        : "Ver o Gestionar mi Cita",
  });

  const supabase = await createClient();

  // Caso 1: Llave Resend disponible -> Envío real
  if (resend) {
    try {
      const response = await resend.emails.send({
        from: `${variables.negocio || "RESERVAPP"} <${defaultFromEmail}>`,
        to: [recipientEmail],
        subject: finalSubject,
        html: htmlContent,
      });

      if (response.error) {
        console.error("Error al enviar correo por Resend:", response.error);

        // Registrar fallo en notifications_log
        await supabase.from("notifications_log").insert({
          business_id: businessId,
          appointment_id: appointmentId || null,
          channel: "email",
          recipient: recipientEmail,
          subject: finalSubject,
          body: finalBody,
          status: "failed",
          attempts: 1,
          error_message: response.error.message,
        });

        return {
          success: false,
          error: response.error.message,
        };
      }

      // Registrar éxito en notifications_log
      await supabase.from("notifications_log").insert({
        business_id: businessId,
        appointment_id: appointmentId || null,
        channel: "email",
        recipient: recipientEmail,
        subject: finalSubject,
        body: finalBody,
        status: "sent",
        attempts: 1,
        sent_at: new Date().toISOString(),
      });

      return {
        success: true,
        messageId: response.data?.id,
      };
    } catch (err: any) {
      console.error("Excepción en llamada a Resend:", err);

      await supabase.from("notifications_log").insert({
        business_id: businessId,
        appointment_id: appointmentId || null,
        channel: "email",
        recipient: recipientEmail,
        subject: finalSubject,
        body: finalBody,
        status: "failed",
        attempts: 1,
        error_message: err.message || "Error desconocido en Resend",
      });

      return {
        success: false,
        error: err.message || "Fallo en envío de correo",
      };
    }
  }

  // Caso 2: Modo simulación (desarrollo / entorno local sin clave Resend)
  console.log("--------------------------------------------------");
  console.log(`[RESEND SIMULATION] Para: ${recipientEmail}`);
  console.log(`[RESEND SIMULATION] Asunto: ${finalSubject}`);
  console.log(`[RESEND SIMULATION] Evento: ${triggerEvent}`);
  console.log("--------------------------------------------------");

  try {
    await supabase.from("notifications_log").insert({
      business_id: businessId,
      appointment_id: appointmentId || null,
      channel: "email",
      recipient: recipientEmail,
      subject: finalSubject,
      body: finalBody,
      status: "sent",
      attempts: 1,
      sent_at: new Date().toISOString(),
    });
  } catch (logErr) {
    console.warn("No se pudo registrar notificación en base de datos:", logErr);
  }

  return {
    success: true,
    simulated: true,
    messageId: `sim_${Date.now()}`,
  };
}
