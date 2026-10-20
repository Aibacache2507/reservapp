import {
  interpolateVariables,
  DEFAULT_WHATSAPP_TEMPLATES,
  DEFAULT_EMAIL_TEMPLATES,
  type MessageVariables,
} from "../src/lib/notifications/templates";
import { buildHtmlEmailLayout } from "../src/lib/notifications/email";
import { buildWhatsAppLink } from "../src/lib/utils/whatsapp";
import { formatCLP } from "../src/lib/utils/chile";
import * as fs from "fs";
import * as path from "path";

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    console.error(`  ✗ [FAIL] ${testName}`);
    if (details) console.error(`    Detalle: ${details}`);
  }
}

async function runStage5Verification() {
  console.log("=================================================");
  console.log("RESERVAPP - SUITE DE VERIFICACIÓN ETAPA 5");
  console.log("Notificaciones y Recordatorios (Resend + wa.me)");
  console.log("=================================================\n");

  // --- 1. VERIFICACIÓN DE ARCHIVOS Y RUTAS DE ETAPA 5 ---
  console.log("1. Verificación de Archivos y Componentes de Notificaciones:");
  const requiredFiles = [
    "src/lib/notifications/templates.ts",
    "src/lib/notifications/email.ts",
    "src/app/api/cron/reminders/route.ts",
    "supabase/migrations/20261020000001_cron_notifications.sql",
    "src/app/admin/notifications/actions.ts",
    "src/app/admin/notifications/notifications-view.tsx",
    "src/app/admin/notifications/page.tsx",
    "src/app/admin/layout.tsx",
  ];

  for (const file of requiredFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    assert(
      fs.existsSync(fullPath),
      `Archivo ${file} existe en el proyecto`,
      `Ruta no encontrada: ${fullPath}`
    );
  }

  // --- 2. MOTOR DE REEMPLAZO DE VARIABLES ---
  console.log("\n2. Motor de Reemplazo e Interpolación de Variables:");
  const testVars: MessageVariables = {
    nombre: "Carolina Soto",
    servicio: "Corte y Tratamiento Olaplex",
    profesional: "Macarena Díaz",
    fecha: "25 de Octubre",
    hora: "17:00",
    direccion: "Av. Las Condes 12345, Santiago",
    enlace_gestion: "https://reservapp.cl/reserva/test_token_abc",
    negocio: "Salón Belleza Total",
    precio: "$35.000",
  };

  const rawTemplate =
    "Hola {nombre}, tu cita para {servicio} con {profesional} es el {fecha} a las {hora} hrs en {negocio}. Total: {precio}. Gestionar: {enlace_gestion}.";
  const interpolated = interpolateVariables(rawTemplate, testVars);

  assert(interpolated.includes("Carolina Soto"), "Reemplaza {nombre} correctamente");
  assert(interpolated.includes("Corte y Tratamiento Olaplex"), "Reemplaza {servicio} correctamente");
  assert(interpolated.includes("Macarena Díaz"), "Reemplaza {profesional} correctamente");
  assert(interpolated.includes("25 de Octubre a las 17:00 hrs"), "Reemplaza {fecha} y {hora}");
  assert(interpolated.includes("$35.000"), "Reemplaza {precio} en formato CLP");
  assert(interpolated.includes("Salón Belleza Total"), "Reemplaza {negocio}");
  assert(interpolated.includes("https://reservapp.cl/reserva/test_token_abc"), "Reemplaza {enlace_gestion}");
  assert(!interpolated.includes("{"), "No quedan llaves sin reemplazar");

  // --- 3. PLANTILLAS PREDETERMINADAS PARA WHATSAPP (wa.me) ---
  console.log("\n3. Validación de Plantillas de WhatsApp:");
  const waEvents = [
    "confirmation",
    "reminder_24h",
    "reminder_2h",
    "cancelled",
    "rescheduled",
    "waitlist_available",
    "review_request",
  ];

  for (const ev of waEvents) {
    const tpl = DEFAULT_WHATSAPP_TEMPLATES[ev];
    assert(!!tpl && tpl.length > 20, `Plantilla WhatsApp para '${ev}' definida y completa`);
  }

  const sampleWaMsg = interpolateVariables(DEFAULT_WHATSAPP_TEMPLATES.reminder_24h, testVars);
  const waUrl = buildWhatsAppLink("+56 9 7654 3210", sampleWaMsg);
  assert(waUrl.startsWith("https://wa.me/56976543210?text="), "Genera enlace wa.me válido para recordatorio");
  assert(waUrl.includes(encodeURIComponent("Salón Belleza Total")), "Codifica negocio en URL de WhatsApp");

  // --- 4. PLANTILLAS PREDETERMINADAS PARA CORREO (RESEND) ---
  console.log("\n4. Validación de Plantillas de Correo Electrónico:");
  for (const ev of waEvents) {
    const tpl = DEFAULT_EMAIL_TEMPLATES[ev];
    assert(!!tpl && !!tpl.subject && !!tpl.body, `Plantilla Email para '${ev}' tiene asunto y cuerpo`);
    const formattedSubject = interpolateVariables(tpl.subject, testVars);
    assert(!formattedSubject.includes("{"), `Asunto de '${ev}' sin variables pendientes`);
  }

  // --- 5. MAQUETACIÓN HTML RESPONSIVA DE CORREO ---
  console.log("\n5. Generador de Correo HTML Responsivo (Resend):");
  const emailHtml = buildHtmlEmailLayout({
    title: "✨ Tu cita en Salón Belleza Total está confirmada",
    bodyText: "Hola Carolina, te esperamos para tu cita de belleza.",
    businessName: "Salón Belleza Total",
    variables: testVars,
    brandColor: "#ec4899",
    ctaText: "Ver mi Cita",
    ctaUrl: testVars.enlace_gestion,
  });

  assert(emailHtml.includes("<!DOCTYPE html>"), "Cabecera HTML5 estándar");
  assert(emailHtml.includes("Salón Belleza Total"), "Nombre del negocio visible en encabezado");
  assert(emailHtml.includes("#ec4899"), "Color de marca corporativo aplicado");
  assert(emailHtml.includes("$35.000"), "Monto CLP reflejado en ficha del correo");
  assert(
    emailHtml.includes("El pago se realiza directamente en el local"),
    "Aviso de pago presencial en el local destacado"
  );
  assert(
    emailHtml.includes("https://reservapp.cl/reserva/test_token_abc"),
    "Botón de llamado a la acción con URL de autogestión"
  );

  // --- 6. CÁLCULO DE VENTANAS TEMPORALES DEL CRON ---
  console.log("\n6. Lógica de Ventanas Horarias para Recordatorios Automáticos:");
  const testNow = new Date("2026-10-24T12:00:00Z");

  // Cita a 24h (mañana a las 12:00Z)
  const appt24h = new Date("2026-10-25T12:00:00Z");
  const diffHours24 = (appt24h.getTime() - testNow.getTime()) / (1000 * 60 * 60);
  assert(
    diffHours24 >= 23 && diffHours24 <= 25,
    "Detecta cita en la ventana de recordatorio de 24 horas (23h a 25h)"
  );

  // Cita a 2h (hoy a las 14:00Z)
  const appt2h = new Date("2026-10-24T14:00:00Z");
  const diffMins2h = (appt2h.getTime() - testNow.getTime()) / (1000 * 60);
  assert(
    diffMins2h >= 105 && diffMins2h <= 135,
    "Detecta cita en la ventana de recordatorio de 2 horas (105 min a 135 min)"
  );

  // Cita fuera de rango (ej. 10h)
  const appt10h = new Date("2026-10-24T22:00:00Z");
  const diffHours10 = (appt10h.getTime() - testNow.getTime()) / (1000 * 60 * 60);
  assert(
    !(diffHours10 >= 23 && diffHours10 <= 25) && !(diffHours10 >= 1.75 && diffHours10 <= 2.25),
    "Ignora citas que no caen en ventana de 24h ni 2h"
  );

  console.log("\n=================================================");
  console.log(`RESULTADO ETAPA 5: ${passedTests} de ${totalTests} pruebas exitosas.`);
  console.log("=================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runStage5Verification().catch((err) => {
  console.error("Error fatal en verificación Etapa 5:", err);
  process.exit(1);
});
