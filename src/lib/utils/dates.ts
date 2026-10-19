import { format, parseISO, isValid } from "date-fns";
import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";

export const CHILE_TIMEZONE = "America/Santiago";

/**
 * Convierte una fecha/hora local de Chile a un objeto Date en UTC para guardarlo en timestamptz
 * @param dateStr Fecha en formato YYYY-MM-DD
 * @param timeStr Hora en formato HH:mm o HH:mm:ss
 */
export function chileanToUTC(dateStr: string, timeStr: string): Date {
  const dateTimeString = `${dateStr}T${timeStr.length === 5 ? `${timeStr}:00` : timeStr}`;
  return fromZonedTime(dateTimeString, CHILE_TIMEZONE);
}

/**
 * Convierte un timestamp UTC (de Supabase) a una representación local en America/Santiago
 */
export function utcToChilean(utcDate: string | Date): Date {
  const date = typeof utcDate === "string" ? parseISO(utcDate) : utcDate;
  return toZonedTime(date, CHILE_TIMEZONE);
}

/**
 * Formatea una fecha UTC al formato legible chileno: ej. "Lunes 24 de Octubre de 2026"
 */
export function formatChileanDate(
  utcDate: string | Date,
  pattern: string = "EEEE d 'de' MMMM 'de' yyyy"
): string {
  const date = typeof utcDate === "string" ? parseISO(utcDate) : utcDate;
  if (!isValid(date)) return "";
  return formatInTimeZone(date, CHILE_TIMEZONE, pattern, { locale: es });
}

/**
 * Formatea una fecha UTC al formato de hora chilena: ej. "15:30 hrs"
 */
export function formatChileanTime(
  utcDate: string | Date,
  pattern: string = "HH:mm 'hrs'"
): string {
  const date = typeof utcDate === "string" ? parseISO(utcDate) : utcDate;
  if (!isValid(date)) return "";
  return formatInTimeZone(date, CHILE_TIMEZONE, pattern, { locale: es });
}

/**
 * Formatea fecha y hora combinadas: ej. "24/10/2026 a las 15:30 hrs"
 */
export function formatChileanDateTime(utcDate: string | Date): string {
  const date = typeof utcDate === "string" ? parseISO(utcDate) : utcDate;
  if (!isValid(date)) return "";
  return formatInTimeZone(
    date,
    CHILE_TIMEZONE,
    "dd/MM/yyyy 'a las' HH:mm 'hrs'",
    { locale: es }
  );
}

/**
 * Retorna la fecha actual en la zona horaria de Chile (YYYY-MM-DD)
 */
export function getChileanTodayDateString(): string {
  return formatInTimeZone(new Date(), CHILE_TIMEZONE, "yyyy-MM-dd");
}

/**
 * Obtiene el día de la semana para un YYYY-MM-DD en Chile (0: Domingo, 1: Lunes, ..., 6: Sábado)
 */
export function getDayOfWeekInChile(dateStr: string): number {
  const date = fromZonedTime(`${dateStr}T12:00:00`, CHILE_TIMEZONE);
  return date.getDay();
}

/**
 * Nombres de los días en español
 */
export const DIAS_SEMANA = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
