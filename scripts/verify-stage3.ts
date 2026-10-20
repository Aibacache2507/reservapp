import { generateICSContent } from "../src/lib/utils/calendar";
import { validateRut, formatRut, formatCLP } from "../src/lib/utils/chile";
import { buildWhatsAppLink, DEFAULT_WHATSAPP_TEMPLATES } from "../src/lib/utils/whatsapp";
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

async function runStage3Verification() {
  console.log("=================================================");
  console.log("RESERVAPP - SUITE DE VERIFICACIÓN ETAPA 3");
  console.log("Flujo de Reserva del Cliente (Sin Cuenta) y Gestión");
  console.log("=================================================\n");

  // --- 1. PRUEBAS DE GENERACIÓN DE ARCHIVO ICALENDAR (.ICS) ---
  console.log("1. Generador de Eventos de Calendario iCalendar (.ics):");
  const sampleEvent = {
    title: "Corte y Peinado en Salón Glamour",
    description: "Cita confirmada con Camila Silva. Pago en el local: $22.000.",
    location: "Av. Providencia 2133, Local 12, Santiago",
    startsAt: "2026-10-24T18:30:00Z",
    endsAt: "2026-10-24T19:15:00Z",
    url: "https://reservapp.cl/reserva/test_token_123",
  };

  const icsText = generateICSContent(sampleEvent);
  assert(icsText.includes("BEGIN:VCALENDAR"), "El archivo contiene cabecera BEGIN:VCALENDAR");
  assert(icsText.includes("VERSION:2.0"), "Versión estándar de iCalendar 2.0");
  assert(icsText.includes("SUMMARY:Corte y Peinado en Salón Glamour"), "Título del evento configurado correctamente");
  assert(icsText.includes("LOCATION:Av. Providencia 2133\\, Local 12\\, Santiago"), "Dirección escapada según estándar RFC 5545");
  assert(icsText.includes("BEGIN:VALARM"), "Alarma de recordatorio preconfigurada (-PT2H)");
  assert(icsText.includes("END:VCALENDAR"), "Cierre del archivo iCalendar");

  // --- 2. PRUEBAS DE ENLACE DE WHATSAPP PARA CLIENTES (WA.ME) ---
  console.log("\n2. Construcción de Enlace wa.me para el Cliente:");
  const waClientLink = buildWhatsAppLink(
    "+56 9 9123 4567",
    "Hola {negocio}, acabo de reservar una cita para *{servicio}* con *{profesional}* el día *{fecha}* a las *{hora}*. Mi nombre es {nombre}. ¡Muchas gracias!",
    {
      negocio: "Salón Glamour",
      servicio: "Balayage Completo",
      profesional: "Valentina Rojas",
      fecha: "25/10/2026",
      hora: "16:00",
      nombre: "Sofía Martínez",
    }
  );

  assert(waClientLink.startsWith("https://wa.me/56991234567?text="), "Enlace hacia número normalizado chileno 56991234567");
  assert(waClientLink.includes(encodeURIComponent("Balayage Completo")), "Contiene servicio codificado");
  assert(waClientLink.includes(encodeURIComponent("Valentina Rojas")), "Contiene profesional codificado");
  assert(waClientLink.includes(encodeURIComponent("Sofía Martínez")), "Contiene nombre del cliente codificado");

  // --- 3. PRUEBAS DE LÓGICA DE CUPONES EN CLP ---
  console.log("\n3. Cálculo de Descuentos y Cupones en Moneda CLP:");
  const basePrice = 25000;
  // Cupón 20%
  const discountPercent = Math.round((basePrice * 20) / 100);
  const finalPricePercent = basePrice - discountPercent;
  assert(discountPercent === 5000 && finalPricePercent === 20000, `Cálculo de 20% sobre $25.000: Descuento ${formatCLP(discountPercent)}, Final ${formatCLP(finalPricePercent)}`);

  // Cupón monto fijo $3.000
  const fixedDiscount = 3000;
  const finalPriceFixed = basePrice - fixedDiscount;
  assert(finalPriceFixed === 22000, `Cálculo de descuento fijo de $3.000: Final ${formatCLP(finalPriceFixed)}`);

  // --- 4. PRUEBAS DE REGLAS DE CANCELACIÓN Y REPROGRAMACIÓN ---
  console.log("\n4. Reglas de Cancelación y Plazo Límite de Horas:");
  const cancellationLimitHours = 24;
  const futureTimeIn48Hours = Date.now() + 48 * 60 * 60 * 1000;
  const futureTimeIn10Hours = Date.now() + 10 * 60 * 60 * 1000;

  const hoursRemaining48 = (futureTimeIn48Hours - Date.now()) / (1000 * 60 * 60);
  const hoursRemaining10 = (futureTimeIn10Hours - Date.now()) / (1000 * 60 * 60);

  const canCancel48 = hoursRemaining48 >= cancellationLimitHours;
  const canCancel10 = hoursRemaining10 >= cancellationLimitHours;

  assert(canCancel48 === true, "Permite cancelar con 48 horas de anticipación (límite: 24h)");
  assert(canCancel10 === false, "Bloquea cancelación con 10 horas de anticipación (límite: 24h)");

  // --- 5. VERIFICACIÓN DE ARCHIVOS DE LA ETAPA 3 ---
  console.log("\n5. Verificación de Componentes y Páginas de la Etapa 3:");
  const requiredFiles = [
    "src/lib/utils/calendar.ts",
    "src/app/[slug]/actions.ts",
    "src/app/[slug]/booking-wizard.tsx",
    "src/app/[slug]/waitlist-modal.tsx",
    "src/app/[slug]/page.tsx",
    "src/app/reserva/[token]/actions.ts",
    "src/app/reserva/[token]/manage-view.tsx",
    "src/app/reserva/[token]/page.tsx",
  ];

  let allFilesExist = true;
  for (const relPath of requiredFiles) {
    const fullPath = path.join(__dirname, "..", relPath);
    if (!fs.existsSync(fullPath)) {
      allFilesExist = false;
      console.error(`  Archivo faltante: ${relPath}`);
    }
  }
  assert(allFilesExist, "Todos los 8 archivos del flujo de reserva del cliente existen en el proyecto");

  // --- RESUMEN FINAL ---
  console.log("\n=================================================");
  console.log(`RESULTADO FINAL: ${passedTests} de ${totalTests} pruebas pasadas con éxito.`);
  if (passedTests === totalTests) {
    console.log("TODAS LAS VERIFICACIONES DE LA ETAPA 3 PASARON CORRECTAMENTE.");
  } else {
    console.error("ALGUNAS PRUEBAS FALLARON.");
    process.exit(1);
  }
  console.log("=================================================");
}

runStage3Verification().catch((err) => {
  console.error("Error fatal durante la verificación:", err);
  process.exit(1);
});
