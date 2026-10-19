import { cleanPhoneForWhatsApp } from "./chile";

/**
 * Variables soportadas en las plantillas de mensajes de WhatsApp
 */
export interface WhatsAppTemplateVariables {
  nombre?: string;
  servicio?: string;
  profesional?: string;
  fecha?: string;
  hora?: string;
  direccion?: string;
  enlace_gestion?: string;
  negocio?: string;
  precio?: string;
  motivo_cancelacion?: string;
  [key: string]: string | undefined;
}

/**
 * Plantillas predefinidas del sistema en español de Chile
 */
export const DEFAULT_WHATSAPP_TEMPLATES = {
  confirmation:
    "¡Hola {nombre}! 👋 Confirmamos tu cita para *{servicio}* con *{profesional}* el día *{fecha}* a las *{hora}* en {negocio} ({direccion}). Si necesitas revisar o reprogramar tu cita, puedes hacerlo aquí: {enlace_gestion}",
  reminder_24h:
    "¡Hola {nombre}! Te recordamos que mañana tienes tu cita para *{servicio}* a las *{hora}* en {negocio} ({direccion}). Por favor confírmanos si asistirás. Para gestionar tu cita: {enlace_gestion}",
  reminder_2h:
    "¡Hola {nombre}! Te esperamos en 2 horas para tu cita de *{servicio}* a las *{hora}* en {negocio}. ¡Nos vemos pronto!",
  rescheduled:
    "Hola {nombre}, tu cita ha sido reprogramada con éxito. Nueva fecha: *{fecha}* a las *{hora}* para *{servicio}* con *{profesional}*. Gestionar: {enlace_gestion}",
  cancelled:
    "Hola {nombre}, te informamos que tu cita para *{servicio}* el *{fecha}* a las *{hora}* ha sido cancelada. Si deseas agendar una nueva hora: {enlace_gestion}",
  waitlist_available:
    "¡Hola {nombre}! Se ha liberado un cupo para *{servicio}* el día *{fecha}* a las *{hora}* en {negocio}. Para tomar este cupo de inmediato ingresa aquí: {enlace_gestion}",
  review_request:
    "¡Hola {nombre}! Esperamos que hayas disfrutado tu atención en {negocio}. ¿Nos regalarías 1 minuto para calificar tu experiencia? Haz clic aquí: {enlace_gestion}",
  client_share_summary:
    "Hola {negocio}, acabo de reservar una cita para *{servicio}* el día *{fecha}* a las *{hora}*. Mi nombre es {nombre}. ¡Muchas gracias!",
};

/**
 * Reemplaza los placeholders {variable} dentro de una plantilla por los valores provistos.
 */
export function interpolateTemplate(
  template: string,
  variables: WhatsAppTemplateVariables
): string {
  if (!template) return "";

  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = variables[key];
    return value !== undefined && value !== null ? String(value) : match;
  });
}

/**
 * Genera un enlace directo a WhatsApp (https://wa.me/569XXXXXXXX?text=...)
 * Cumple con la regla de formato:
 * 1. Número internacional sin "+" ni espacios (ej. 56912345678).
 * 2. Mensaje interpolado y codificado con encodeURIComponent.
 *
 * @param phone Teléfono del destinatario (se limpiará automáticamente)
 * @param template Texto o plantilla del mensaje con tags {variable}
 * @param variables Objeto con los valores para reemplazar en la plantilla
 */
export function buildWhatsAppLink(
  phone: string,
  template: string,
  variables: WhatsAppTemplateVariables = {}
): string {
  const cleanedPhone = cleanPhoneForWhatsApp(phone);
  const interpolatedMessage = interpolateTemplate(template, variables);
  const encodedText = encodeURIComponent(interpolatedMessage);

  if (!cleanedPhone) {
    // Si no hay teléfono específico (ej. abrir WhatsApp Web general con texto)
    return `https://wa.me/?text=${encodedText}`;
  }

  return `https://wa.me/${cleanedPhone}?text=${encodedText}`;
}
