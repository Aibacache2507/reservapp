/**
 * Utilidad de Rate Limiting ligero en memoria para protección contra spam y fuerza bruta.
 * Utiliza ventana deslizante (sliding window) por dirección IP o identificador único.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Limpieza periódica de registros vencidos cada 5 minutos
if (typeof setInterval !== "undefined") {
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }
}

/**
 * Valida si un identificador (ej. IP o RUT) ha superado el límite de peticiones permitido.
 * @param identifier Cadena única que identifica al cliente (IP, RUT, token)
 * @param maxRequests Máximo número de peticiones permitidas en la ventana
 * @param windowSeconds Duración de la ventana en segundos
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowSeconds: number = 60
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  const existing = rateLimitStore.get(identifier);

  if (!existing || now > existing.resetAt) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetInSeconds: windowSeconds,
    };
  }

  if (existing.count >= maxRequests) {
    const resetInSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds,
    };
  }

  existing.count += 1;
  const resetInSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return {
    allowed: true,
    remaining: maxRequests - existing.count,
    resetInSeconds,
  };
}
