/**
 * Utilidad para generar archivos de calendario iCalendar (.ics) estándar (RFC 5545)
 * Compatible con Google Calendar, Apple Calendar, Outlook y dispositivos móviles.
 */

export interface CalendarEventProps {
  title: string;
  description: string;
  location: string;
  startsAt: Date | string;
  endsAt: Date | string;
  url?: string;
}

/**
 * Formatea una fecha UTC al formato iCalendar: YYYYMMDDTHHMMSSZ
 */
function formatToICSDate(dateInput: Date | string): string {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/**
 * Genera el contenido en texto plano de un archivo .ics
 */
export function generateICSContent(event: CalendarEventProps): string {
  const startStr = formatToICSDate(event.startsAt);
  const endStr = formatToICSDate(event.endsAt);
  const nowStr = formatToICSDate(new Date());
  const uid = `reservapp-${Date.now()}@reservapp.cl`;

  // Limpiar caracteres de retorno de carro
  const cleanDescription = (event.description || "")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,");
  const cleanLocation = (event.location || "").replace(/,/g, "\\,");
  const cleanTitle = (event.title || "").replace(/,/g, "\\,");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//RESERVAPP//Agendamiento Chile//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${nowStr}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${cleanTitle}`,
    `DESCRIPTION:${cleanDescription}`,
    `LOCATION:${cleanLocation}`,
    event.url ? `URL:${event.url}` : "",
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "DESCRIPTION:Recordatorio de Cita en RESERVAPP",
    "ACTION:DISPLAY",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

/**
 * Descarga en el navegador un archivo .ics generado al vuelo
 */
export function downloadICSFile(filename: string, event: CalendarEventProps): void {
  const icsData = generateICSContent(event);
  const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${filename}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
