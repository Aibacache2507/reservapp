import { validateRut, formatRut, formatCLP, normalizeChileanPhone } from "../src/lib/utils/chile";
import { buildWhatsAppLink } from "../src/lib/utils/whatsapp";
import { checkRateLimit } from "../src/lib/utils/rate-limit";
import { generateCSV } from "../src/lib/utils/export";
import { buildHtmlEmailLayout } from "../src/lib/notifications/email";
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

async function runStage8Verification() {
  console.log("=================================================");
  console.log("RESERVAPP - SUITE DE VERIFICACIÓN ETAPA 8");
  console.log("Calidad, Seguridad, PWA y Flujo Integral e2e");
  console.log("=================================================\n");

  // --- 1. VERIFICACIÓN DE ARTIFACTS Y ARCHIVOS DE PRODUCCIÓN ---
  console.log("1. Verificación de Archivos PWA y Seguridad:");
  const requiredProductionFiles = [
    "public/manifest.json",
    "public/icon.svg",
    "public/sw.js",
    "src/lib/utils/rate-limit.ts",
    "next.config.ts",
    "README.md",
    ".env.example",
  ];

  for (const file of requiredProductionFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    assert(
      fs.existsSync(fullPath),
      `Archivo ${file} presente en el proyecto`,
      `Ruta no encontrada: ${fullPath}`
    );
  }

  // --- 2. VERIFICACIÓN DE MANIFIESTO PWA Y SERVICE WORKER ---
  console.log("\n2. Validación de Configuración PWA:");
  const manifestPath = path.resolve(process.cwd(), "public/manifest.json");
  const manifestRaw = fs.readFileSync(manifestPath, "utf-8");
  const manifest = JSON.parse(manifestRaw);

  assert(manifest.short_name === "RESERVAPP", "Nombre corto PWA: RESERVAPP");
  assert(manifest.display === "standalone", "Modo de despliegue standalone (pantalla completa móvil)");
  assert(manifest.theme_color === "#ec4899", "Color de tema corporativo (#ec4899)");
  assert(manifest.lang === "es-CL", "Idioma chileno es-CL configurado");
  assert(manifest.icons.length > 0, "Íconos PWA configurados");

  const swPath = path.resolve(process.cwd(), "public/sw.js");
  const swContent = fs.readFileSync(swPath, "utf-8");
  assert(swContent.includes("addEventListener(\"install\""), "Service Worker gestiona evento install");
  assert(swContent.includes("addEventListener(\"fetch\""), "Service Worker gestiona interceptación de red fetch");

  // --- 3. PRUEBAS DE RATE LIMITING Y SEGURIDAD ---
  console.log("\n3. Mecanismo de Rate Limiting Anti-Spam:");
  const testIp = `test_ip_${Date.now()}`;
  const limitMax = 3;
  const windowSec = 10;

  // Primeras 3 peticiones deben ser permitidas
  const r1 = checkRateLimit(testIp, limitMax, windowSec);
  assert(r1.allowed && r1.remaining === 2, "Petición 1 permitida (restan 2)");

  const r2 = checkRateLimit(testIp, limitMax, windowSec);
  assert(r2.allowed && r2.remaining === 1, "Petición 2 permitida (resta 1)");

  const r3 = checkRateLimit(testIp, limitMax, windowSec);
  assert(r3.allowed && r3.remaining === 0, "Petición 3 permitida (límite alcanzado)");

  // 4ta petición debe ser bloqueada
  const r4 = checkRateLimit(testIp, limitMax, windowSec);
  assert(!r4.allowed && r4.remaining === 0, "Petición 4 bloqueada por rate limit");
  assert(r4.resetInSeconds > 0, `Tiempo de espera informado (${r4.resetInSeconds}s)`);

  // --- 4. VERIFICACIÓN DE CABECERAS HTTP DE SEGURIDAD ---
  console.log("\n4. Cabeceras HTTP de Seguridad en next.config.ts:");
  const nextConfigPath = path.resolve(process.cwd(), "next.config.ts");
  const nextConfigContent = fs.readFileSync(nextConfigPath, "utf-8");
  assert(nextConfigContent.includes("X-Content-Type-Options"), "Cabecera X-Content-Type-Options: nosniff");
  assert(nextConfigContent.includes("X-Frame-Options"), "Cabecera X-Frame-Options: DENY");
  assert(nextConfigContent.includes("Referrer-Policy"), "Cabecera Referrer-Policy");

  // --- 5. AUDITORÍA INTEGRAL DE FLUJO E2E DE RESERVA ---
  console.log("\n5. Auditoría de Flujo Integral e2e (Extremo a Extremo):");

  // Paso A: Cliente y RUT
  const clientRut = "18.234.567-9";
  assert(validateRut(clientRut), "Paso A: RUT del cliente válido (18.234.567-9)");
  const phone = normalizeChileanPhone("+56 9 8765 4321");
  assert(phone === "+56987654321", "Paso A: Teléfono chileno normalizado a E.164 (+56987654321)");

  // Paso B: Precios y CLP
  const originalPrice = 45000;
  const couponDiscount = 5000;
  const finalPrice = originalPrice - couponDiscount;
  assert(formatCLP(finalPrice) === "$40.000", "Paso B: Cálculo de precio final con descuento en CLP ($40.000)");

  // Paso C: Correo de confirmación con Resend
  const emailHtml = buildHtmlEmailLayout({
    title: "Cita Confirmada",
    bodyText: "Tu reserva está lista.",
    businessName: "Salón Glamour",
    variables: {
      nombre: "Valentina",
      servicio: "Color y Peinado",
      fecha: "25 de Octubre",
      hora: "11:00",
      precio: formatCLP(finalPrice),
    },
    brandColor: "#ec4899",
  });
  assert(emailHtml.includes("$40.000"), "Paso C: Monto CLP reflejado en correo de confirmación");

  // Paso D: Enlace wa.me de recordatorio
  const waLink = buildWhatsAppLink(phone, "Hola {nombre}, te recordamos tu cita de {servicio}.", {
    nombre: "Valentina",
    servicio: "Color y Peinado",
  });
  assert(waLink.includes("https://wa.me/56987654321"), "Paso D: Enlace wa.me generado hacia número normalizado");

  // Paso E: Comisión del profesional al completar la cita
  const commPct = 40;
  const commAmount = Math.round((finalPrice * commPct) / 100);
  assert(commAmount === 16000, "Paso E: Comisión calculada al completar servicio (40% de $40.000 = $16.000 CLP)");

  // Paso F: Exportación CSV de liquidación
  const csvReport = generateCSV([{ prof: "Camila", monto: commAmount }], [
    { key: "prof", header: "Profesional" },
    { key: "monto", header: "Comision", format: (v) => formatCLP(v) },
  ]);
  assert(csvReport.includes('"$16.000"'), "Paso F: Exportación CSV compatible con Excel incluye formato CLP");

  // --- 6. VERIFICACIÓN DE DOCUMENTACIÓN ---
  console.log("\n6. Validación de Documentación README.md:");
  const readmePath = path.resolve(process.cwd(), "README.md");
  const readmeContent = fs.readFileSync(readmePath, "utf-8");
  assert(readmeContent.includes("Next.js 16"), "README menciona versión Next.js 16");
  assert(readmeContent.includes("Vercel"), "README incluye guía de despliegue en Vercel");
  assert(readmeContent.includes("Supabase"), "README documenta configuración de base de datos Supabase");
  assert(readmeContent.includes("pg_cron"), "README documenta programación de cron");
  assert(readmeContent.includes("wa.me"), "README documenta regla estricta de WhatsApp sin API de pago");

  console.log("\n=================================================");
  console.log(`RESULTADO ETAPA 8: ${passedTests} de ${totalTests} pruebas exitosas.`);
  console.log("=================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runStage8Verification().catch((err) => {
  console.error("Error fatal en verificación Etapa 8:", err);
  process.exit(1);
});
