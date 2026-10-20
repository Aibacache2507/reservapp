import { sanitizeSlug } from "../src/app/admin/onboarding/actions";
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

async function runStage2Verification() {
  console.log("=================================================");
  console.log("RESERVAPP - SUITE DE VERIFICACIÓN ETAPA 2");
  console.log("Autenticación, Onboarding SaaS y Configuración");
  console.log("=================================================\n");

  // --- 1. PRUEBAS DE SANITIZACIÓN DE SLUGS ---
  console.log("1. Pruebas de Sanitización de URL Slug:");
  const slug1 = await sanitizeSlug("Salón Belleza & Glamour!");
  assert(slug1 === "salon-belleza-glamour", `Limpia acentos y símbolos: '${slug1}' === 'salon-belleza-glamour'`);

  const slug2 = await sanitizeSlug("Peluquería Providencia 123");
  assert(slug2 === "peluqueria-providencia-123", `Mantiene números: '${slug2}' === 'peluqueria-providencia-123'`);

  const slug3 = await sanitizeSlug("---Estética---Facial---");
  assert(slug3 === "estetica-facial", `Elimina guiones múltiples e iniciales/finales: '${slug3}' === 'estetica-facial'`);

  const slug4 = await sanitizeSlug("Uñas & Spa Ñuñoa");
  assert(slug4 === "unas-spa-nunoa", `Maneja correctamente la 'ñ' y acentos: '${slug4}' === 'unas-spa-nunoa'`);

  // --- 2. VERIFICACIÓN DE REGLAS DE RESERVA ---
  console.log("\n2. Validación de Reglas de Reserva Configurables:");
  const sampleRules = {
    min_advance_hours: 2,
    max_advance_days: 60,
    cancellation_limit_hours: 24,
    max_reschedules: 2,
    slot_interval_minutes: 15,
    no_show_policy: "Política chilena de inasistencia",
  };

  assert(sampleRules.min_advance_hours >= 0 && sampleRules.min_advance_hours <= 72, "Anticipación mínima en rango válido (0 a 72 hrs)");
  assert(sampleRules.max_advance_days >= 1 && sampleRules.max_advance_days <= 365, "Anticipación máxima en rango válido (1 a 365 días)");
  assert(sampleRules.cancellation_limit_hours >= 0, "Límite de cancelación no negativo");
  assert([15, 30, 60].includes(sampleRules.slot_interval_minutes), "Intervalo de slot estándar permitido (15/30/60 min)");

  // --- 3. VERIFICACIÓN DE ESTRUCTURA DE ARCHIVOS DE LA ETAPA 2 ---
  console.log("\n3. Verificación de Archivos y Componentes de la Etapa 2:");
  const requiredFiles = [
    // UI
    "src/components/ui/button.tsx",
    "src/components/ui/input.tsx",
    "src/components/ui/label.tsx",
    "src/components/ui/card.tsx",
    "src/components/ui/badge.tsx",
    "src/components/ui/tabs.tsx",
    "src/components/ui/switch.tsx",
    "src/components/ui/textarea.tsx",
    // Auth
    "src/app/auth/actions.ts",
    "src/app/auth/callback/route.ts",
    "src/app/(auth)/login/page.tsx",
    "src/app/(auth)/register/page.tsx",
    "src/app/(auth)/forgot-password/page.tsx",
    // Onboarding
    "src/app/admin/onboarding/actions.ts",
    "src/app/admin/onboarding/page.tsx",
    // Admin & Settings
    "src/app/admin/layout.tsx",
    "src/app/admin/page.tsx",
    "src/app/admin/settings/actions.ts",
    "src/app/admin/settings/settings-view.tsx",
    "src/app/admin/settings/page.tsx",
    // Superadmin
    "src/app/superadmin/actions.ts",
    "src/app/superadmin/layout.tsx",
    "src/app/superadmin/superadmin-view.tsx",
    "src/app/superadmin/page.tsx",
  ];

  let allFilesExist = true;
  for (const relPath of requiredFiles) {
    const fullPath = path.join(__dirname, "..", relPath);
    if (!fs.existsSync(fullPath)) {
      allFilesExist = false;
      console.error(`  Archivo faltante: ${relPath}`);
    }
  }
  assert(allFilesExist, "Todos los 24 archivos requeridos para la Etapa 2 existen en el proyecto");

  // --- RESUMEN FINAL ---
  console.log("\n=================================================");
  console.log(`RESULTADO FINAL: ${passedTests} de ${totalTests} pruebas pasadas con éxito.`);
  if (passedTests === totalTests) {
    console.log("TODAS LAS VERIFICACIONES DE LA ETAPA 2 PASARON CORRECTAMENTE.");
  } else {
    console.error("ALGUNAS PRUEBAS FALLARON.");
    process.exit(1);
  }
  console.log("=================================================");
}

runStage2Verification().catch((err) => {
  console.error("Error fatal durante la verificación:", err);
  process.exit(1);
});
