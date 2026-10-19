/**
 * Utilidades para el contexto regional de Chile (RUT, Moneda CLP, Teléfono +56)
 */

/**
 * Limpia un RUT eliminando puntos, guiones y espacios en blanco, convirtiendo a mayúsculas.
 * Ejemplo: " 12.345.678-k " -> "12345678K"
 */
export function cleanRut(rut: string): string {
  if (!rut) return "";
  return rut.replace(/[^0-9kK]/g, "").toUpperCase();
}

/**
 * Valida un RUT chileno utilizando el algoritmo de Módulo 11 para el dígito verificador.
 * Soporta formatos con o sin puntos/guión, y dígito 'K'/'k'.
 */
export function validateRut(rut: string): boolean {
  const cleaned = cleanRut(rut);
  if (cleaned.length < 2) return false;

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  // El cuerpo debe ser numérico y con longitud adecuada (ej. 1.000.000 a 99.999.999)
  if (!/^\d+$/.test(body)) return false;

  let sum = 0;
  let multiplier = 2;

  // Recorrer de derecha a izquierda multiplicando por 2,3,4,5,6,7,2...
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body.charAt(i), 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  let expectedDv = "";
  if (remainder === 11) {
    expectedDv = "0";
  } else if (remainder === 10) {
    expectedDv = "K";
  } else {
    expectedDv = remainder.toString();
  }

  return dv === expectedDv;
}

/**
 * Formatea un RUT al estándar chileno: 12.345.678-9 o 1.234.567-K
 */
export function formatRut(rut: string): string {
  const cleaned = cleanRut(rut);
  if (!cleaned) return "";
  if (cleaned.length < 2) return cleaned;

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  // Insertar puntos cada 3 dígitos de derecha a izquierda
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formattedBody}-${dv}`;
}

/**
 * Formatea un monto en Pesos Chilenos (CLP).
 * En Chile, los pesos no llevan centavos/decimales y el separador de miles es el punto.
 * Ejemplo: 12990 -> "$12.990"
 */
export function formatCLP(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return "$0";
  }
  const integerPart = Math.round(amount);
  const formatted = integerPart
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `$${formatted}`;
}

/**
 * Convierte un texto con formato CLP de vuelta a número entero.
 * Ejemplo: "$12.990" -> 12990
 */
export function parseCLP(formatted: string): number {
  if (!formatted) return 0;
  const cleaned = formatted.replace(/[^0-9-]/g, "");
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

/**
 * Valida si un número corresponde a un teléfono móvil chileno válido.
 * Acepta formatos: +56 9 1234 5678, 56912345678, 912345678, etc.
 */
export function isValidChileanPhone(phone: string): boolean {
  if (!phone) return false;
  const digitsOnly = phone.replace(/\D/g, "");

  // Si tiene prefijo internacional 569 seguido de 8 dígitos
  if (digitsOnly.length === 11 && digitsOnly.startsWith("569")) {
    return true;
  }
  // Si tiene 9 dígitos comenzando con 9 (ej. 912345678)
  if (digitsOnly.length === 9 && digitsOnly.startsWith("9")) {
    return true;
  }
  // Si tiene 8 dígitos móviles locales
  if (digitsOnly.length === 8) {
    return true;
  }
  return false;
}

/**
 * Normaliza un teléfono chileno al estándar internacional E.164: +569XXXXXXXX
 */
export function normalizeChileanPhone(phone: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("569")) {
    return `+${digits}`;
  }
  if (digits.length === 9 && digits.startsWith("9")) {
    return `+56${digits}`;
  }
  if (digits.length === 8) {
    return `+569${digits}`;
  }
  // Si ya tiene algún otro formato, asegurar prefijo +569 si falta
  return digits.startsWith("56") ? `+${digits}` : `+56${digits}`;
}

/**
 * Limpia un teléfono para uso directo en enlaces wa.me (sin "+", sin espacios, solo dígitos internacionales).
 * Ejemplo: "+56 9 1234 5678" -> "56912345678"
 */
export function cleanPhoneForWhatsApp(phone: string): string {
  const normalized = normalizeChileanPhone(phone);
  return normalized.replace(/\D/g, "");
}

/**
 * Formatea un teléfono chileno para mostrarlo amigablemente en la interfaz:
 * Ejemplo: "+56 9 1234 5678"
 */
export function formatDisplayPhone(phone: string): string {
  const digits = cleanPhoneForWhatsApp(phone);
  if (digits.length === 11 && digits.startsWith("569")) {
    const p1 = digits.slice(0, 2); // 56
    const p2 = digits.slice(2, 3); // 9
    const p3 = digits.slice(3, 7); // 1234
    const p4 = digits.slice(7, 11); // 5678
    return `+${p1} ${p2} ${p3} ${p4}`;
  }
  return phone;
}
