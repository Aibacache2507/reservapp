/**
 * Plantillas predeterminadas y motor de reemplazo de variables para WhatsApp y Email
 * en español de Chile.
 */

export interface MessageVariables {
  nombre?: string;
  servicio?: string;
  profesional?: string;
  fecha?: string;
  hora?: string;
  direccion?: string;
  enlace_gestion?: string;
  negocio?: string;
  precio?: string;
  [key: string]: string | undefined;
}

/**
 * Reemplaza variables en una plantilla de texto.
 * Ejemplo: "Hola {nombre}, tu cita para {servicio}..." -> "Hola Francisca, tu cita para Corte..."
 */
export function interpolateVariables(template: string, variables: MessageVariables): string {
  if (!template) return "";
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{${key}\\}`, "gi");
    result = result.replace(regex, value || "");
  }
  return result;
}

/**
 * Plantillas estándar para WhatsApp (mensajes concisos con formato Markdown y emojis)
 */
export const DEFAULT_WHATSAPP_TEMPLATES: Record<string, string> = {
  confirmation:
    "¡Hola {nombre}! ✨ Tu cita en *{negocio}* ha sido confirmada con éxito.\n\n" +
    "💇‍♀️ *Servicio:* {servicio}\n" +
    "👤 *Profesional:* {profesional}\n" +
    "📅 *Fecha:* {fecha}\n" +
    "⏰ *Hora:* {hora} hrs\n" +
    "📍 *Dirección:* {direccion}\n\n" +
    "Para revisar, reagendar o cancelar tu hora, usa este enlace:\n{enlace_gestion}\n\n" +
    "¡Te esperamos con el mejor servicio!",

  reminder_24h:
    "¡Hola {nombre}! ⏰ Te recordamos tu cita de mañana en *{negocio}*:\n\n" +
    "💇‍♀️ *Servicio:* {servicio} con {profesional}\n" +
    "📅 *Fecha:* Mañana {fecha}\n" +
    "⏰ *Hora:* {hora} hrs\n" +
    "📍 *Dirección:* {direccion}\n\n" +
    "Si necesitas gestionar tu cita, hazlo aquí:\n{enlace_gestion}\n\n" +
    "Por favor confírmanos respondiendo a este mensaje. ¡Nos vemos!",

  reminder_2h:
    "¡Hola {nombre}! ⏳ Te recordamos que tu cita en *{negocio}* es en 2 horas ({hora} hrs).\n\n" +
    "💇‍♀️ *Servicio:* {servicio} con {profesional}\n" +
    "📍 *Dirección:* {direccion}\n\n" +
    "¡Te estamos esperando!",

  cancelled:
    "Hola {nombre}, te informamos que tu cita para *{servicio}* en *{negocio}* fijada para el {fecha} a las {hora} hrs ha sido cancelada.\n\n" +
    "Si deseas volver a agendar en otro horario, puedes hacerlo aquí:\n{enlace_gestion}",

  rescheduled:
    "¡Hola {nombre}! Tu cita en *{negocio}* ha sido reprogramada con éxito:\n\n" +
    "💇‍♀️ *Servicio:* {servicio}\n" +
    "👤 *Profesional:* {profesional}\n" +
    "📅 *Nueva Fecha:* {fecha}\n" +
    "⏰ *Nueva Hora:* {hora} hrs\n" +
    "📍 *Dirección:* {direccion}\n\n" +
    "Gestión de cita:\n{enlace_gestion}",

  waitlist_available:
    "¡Hola {nombre}! 🎉 Tenemos buenas noticias de *{negocio}*.\n\n" +
    "Se ha liberado un cupo para tu servicio solicitado: *{servicio}*.\n" +
    "Puedes tomar el turno de inmediato ingresando a:\n{enlace_gestion}\n\n" +
    "¡Apúrate antes de que otro cliente tome el cupo disponible!",

  review_request:
    "¡Hola {nombre}! Esperamos que hayas disfrutado tu experiencia con nosotros en *{negocio}* con {profesional} ⭐.\n\n" +
    "Nos encantaría conocer tu opinión para seguir mejorando. ¿Nos dejarías una reseña rápida?\n{enlace_gestion}\n\n" +
    "¡Muchas gracias por tu preferencia!",
};

/**
 * Plantillas estándar para Correos Electrónicos (asunto y cuerpo)
 */
export const DEFAULT_EMAIL_TEMPLATES: Record<
  string,
  { subject: string; body: string }
> = {
  confirmation: {
    subject: "✨ ¡Tu cita en {negocio} está confirmada!",
    body:
      "Hola {nombre},\n\n" +
      "Tu cita ha sido agendada con éxito en {negocio}. A continuación te dejamos el detalle:\n\n" +
      "• Servicio: {servicio}\n" +
      "• Profesional: {profesional}\n" +
      "• Fecha y hora: {fecha} a las {hora} hrs\n" +
      "• Total a pagar en el local: {precio}\n" +
      "• Dirección: {direccion}\n\n" +
      "Recuerda llegar 5 minutos antes de tu hora.",
  },

  reminder_24h: {
    subject: "⏰ Recordatorio: Mañana tienes tu cita en {negocio}",
    body:
      "Hola {nombre},\n\n" +
      "Te recordamos que mañana {fecha} a las {hora} hrs tienes tu cita para {servicio} con {profesional} en {negocio}.\n\n" +
      "Dirección del local: {direccion}.\n\n" +
      "Si necesitas reprogramar o cancelar, hazlo con la debida anticipación en tu enlace de gestión.",
  },

  reminder_2h: {
    subject: "⏳ Tu cita en {negocio} es en 2 horas",
    body:
      "Hola {nombre},\n\n" +
      "Te esperamos hoy a las {hora} hrs para tu cita de {servicio} con {profesional}.\n\n" +
      "Estamos ubicados en: {direccion}.\n\n" +
      "¡Nos vemos pronto!",
  },

  cancelled: {
    subject: "❌ Cita cancelada en {negocio}",
    body:
      "Hola {nombre},\n\n" +
      "Te confirmamos que tu cita para {servicio} del {fecha} a las {hora} hrs ha sido cancelada.\n\n" +
      "Esperamos verte pronto nuevamente en {negocio}.",
  },

  rescheduled: {
    subject: "🔄 Cita reprogramada con éxito en {negocio}",
    body:
      "Hola {nombre},\n\n" +
      "Tu cita ha sido cambiada a un nuevo horario:\n\n" +
      "• Nueva fecha y hora: {fecha} a las {hora} hrs\n" +
      "• Servicio: {servicio}\n" +
      "• Profesional: {profesional}\n" +
      "• Dirección: {direccion}\n\n" +
      "¡Te esperamos!",
  },

  waitlist_available: {
    subject: "🎉 ¡Cupo disponible para ti en {negocio}!",
    body:
      "Hola {nombre},\n\n" +
      "Se ha liberado un horario para el servicio {servicio} que estabas esperando en {negocio}.\n\n" +
      "Para reservar este cupo antes de que sea tomado por otra persona, haz clic en el siguiente enlace:\n{enlace_gestion}",
  },

  review_request: {
    subject: "⭐ ¿Cómo estuvo tu experiencia en {negocio}?",
    body:
      "Hola {nombre},\n\n" +
      "Muchas gracias por visitarnos hoy para tu cita de {servicio} con {profesional}.\n\n" +
      "Tu opinión es fundamental para nosotros. ¿Podrías dejarnos una breve reseña de tu experiencia?",
  },
};
