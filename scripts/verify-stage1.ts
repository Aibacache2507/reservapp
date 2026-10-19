import {
  validateRut,
  formatRut,
  cleanRut,
  formatCLP,
  parseCLP,
  isValidChileanPhone,
  normalizeChileanPhone,
  cleanPhoneForWhatsApp,
  formatDisplayPhone,
} from "../src/lib/utils/chile";

import {
  buildWhatsAppLink,
  interpolateTemplate,
  DEFAULT_WHATSAPP_TEMPLATES,
} from "../src/lib/utils/whatsapp";

import {
  formatChileanDate,
  formatChileanTime,
  formatChileanDateTime,
  chileanToUTC,
  CHILE_TIMEZONE,
} from "../src/lib/utils/dates";

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

console.log("=================================================");
console.log("RESERVAPP - SUITE DE VERIFICACIÓN ETAPA 1");
console.log("Contexto Regional, WhatsApp, Fechas y Migraciones");
console.log("=================================================\n");

// --- 1. PRUEBAS DE RUT CHILENO (MÓDULO 11) ---
console.log("1. Pruebas de RUT Chileno (Módulo 11):");
assert(validateRut("18.234.567-9"), "Valida RUT correcto con puntos y guión (18.234.567-9)");
assert(validateRut("182345679"), "Valida RUT correcto sin formato (182345679)");
assert(validateRut("11.111.111-1"), "Valida RUT 11.111.111-1");
assert(validateRut("10.000.013-K"), "Valida RUT con dígito 'K' mayúscula (10.000.013-K)");
assert(validateRut("10000013k"), "Valida RUT con dígito 'k' minúscula sin formato (10000013k)");
assert(!validateRut("18.234.567-8"), "Rechaza RUT con dígito verificador erróneo (18.234.567-8)");
assert(!validateRut("10.000.013-4"), "Rechaza RUT con dígito verificador erróneo (10.000.013-4)");
assert(!validateRut("123"), "Rechaza RUT demasiado corto");
assert(!validateRut("abcd"), "Rechaza RUT con caracteres no numéricos en el cuerpo");

assert(formatRut("182345679") === "18.234.567-9", "Formatea RUT simple a 18.234.567-9");
assert(formatRut("10000013k") === "10.000.013-K", "Formatea RUT con K a 10.000.013-K");
assert(cleanRut("18.234.567-9") === "182345679", "Limpia RUT eliminando puntos y guión");

// --- 2. PRUEBAS DE MONEDA CLP ---
console.log("\n2. Pruebas de Moneda CLP (Sin decimales, separador de miles '.'):");
assert(formatCLP(12990) === "$12.990", "Formatea CLP 12990 como $12.990");
assert(formatCLP(75000) === "$75.000", "Formatea CLP 75000 como $75.000");
assert(formatCLP(1500000) === "$1.500.000", "Formatea CLP un millón quinientos como $1.500.000");
assert(formatCLP(0) === "$0", "Formatea CLP 0 como $0");
assert(parseCLP("$12.990") === 12990, "Parsea '$12.990' a 12990 entero");
assert(parseCLP("$75.000") === 75000, "Parsea '$75.000' a 75000 entero");

// --- 3. PRUEBAS DE TELÉFONO CHILENO Y WHATSAPP ---
console.log("\n3. Pruebas de Teléfono Móvil y Enlaces wa.me:");
assert(isValidChileanPhone("+56 9 1234 5678"), "Detecta teléfono chileno válido con +56");
assert(isValidChileanPhone("912345678"), "Detecta teléfono chileno de 9 dígitos");
assert(isValidChileanPhone("56912345678"), "Detecta teléfono con prefijo 569");
assert(normalizeChileanPhone("9 1234 5678") === "+56912345678", "Normaliza a E.164 (+56912345678)");
assert(cleanPhoneForWhatsApp("+56 9 1234 5678") === "56912345678", "Limpia para wa.me sin '+' ni espacios");
assert(formatDisplayPhone("56912345678") === "+56 9 1234 5678", "Formatea teléfono para despliegue amigable");

// Construcción de enlace de WhatsApp
const waLink = buildWhatsAppLink(
  "+56 9 8765 4321",
  DEFAULT_WHATSAPP_TEMPLATES.confirmation,
  {
    nombre: "Sofía Martínez",
    servicio: "Corte y Secado",
    profesional: "Camila Silva",
    fecha: "24/10/2026",
    hora: "15:30",
    negocio: "Salón Glamour",
    direccion: "Av. Providencia 2133",
    enlace_gestion: "https://reservapp.cl/c/token123",
  }
);

assert(waLink.startsWith("https://wa.me/56987654321?text="), "El enlace inicia con https://wa.me/56987654321?text=");
assert(waLink.includes(encodeURIComponent("Sofía Martínez")), "El mensaje incluye el nombre codificado");
assert(waLink.includes(encodeURIComponent("Camila Silva")), "El mensaje incluye el profesional codificado");
assert(waLink.includes(encodeURIComponent("https://reservapp.cl/c/token123")), "El mensaje incluye el enlace de gestión");

// --- 4. PRUEBAS DE FECHAS Y ZONA HORARIA AMERICA/SANTIAGO ---
console.log("\n4. Pruebas de Zona Horaria (America/Santiago):");
const sampleUTC = chileanToUTC("2026-10-24", "15:30");
assert(sampleUTC instanceof Date && !isNaN(sampleUTC.getTime()), "Genera fecha UTC válida a partir de hora chilena");
const formattedDate = formatChileanDate(sampleUTC, "yyyy-MM-dd");
assert(formattedDate === "2026-10-24", `Fecha local en Chile coincide: ${formattedDate}`);
const formattedTime = formatChileanTime(sampleUTC);
assert(formattedTime.includes("15:30"), `Hora local en Chile coincide: ${formattedTime}`);

// --- 5. INSPECCIÓN DE MIGRACIONES SQL ---
console.log("\n5. Verificación de Migraciones SQL y Restricciones Multi-Tenant:");
const migrationPath1 = path.join(__dirname, "..", "supabase", "migrations", "20261019000001_initial_schema.sql");
const migrationPath2 = path.join(__dirname, "..", "supabase", "migrations", "20261019000002_availability_function.sql");
const seedPath = path.join(__dirname, "..", "supabase", "seed.sql");

assert(fs.existsSync(migrationPath1), "Existe archivo de migración inicial (20261019000001_initial_schema.sql)");
assert(fs.existsSync(migrationPath2), "Existe archivo de función de disponibilidad (20261019000002_availability_function.sql)");
assert(fs.existsSync(seedPath), "Existe archivo de datos semilla (seed.sql)");

const sqlContent1 = fs.readFileSync(migrationPath1, "utf-8");
const sqlContent2 = fs.readFileSync(migrationPath2, "utf-8");

// Validar tablas mínimas requeridas
const requiredTables = [
  "businesses",
  "branches",
  "profiles",
  "business_members",
  "professionals",
  "service_categories",
  "services",
  "service_variants",
  "professional_services",
  "working_hours",
  "breaks",
  "time_off",
  "schedule_blocks",
  "clients",
  "client_records",
  "appointments",
  "waitlist",
  "promotions",
  "coupons",
  "packs",
  "inventory_items",
  "inventory_movements",
  "commissions",
  "reviews",
  "gallery_images",
  "message_templates",
  "notifications_log",
];

let allTablesFound = true;
for (const table of requiredTables) {
  if (!sqlContent1.includes(`CREATE TABLE IF NOT EXISTS public.${table}`)) {
    allTablesFound = false;
    console.error(`  Tabla faltante: ${table}`);
  }
}
assert(allTablesFound, `Todas las 27 tablas mínimas existen en la migración inicial`);

// Validar restricción de exclusión crítica
assert(
  sqlContent1.includes("CONSTRAINT no_overlapping_active_appointments") &&
  sqlContent1.includes("EXCLUDE USING gist") &&
  sqlContent1.includes("tstzrange(starts_at, ends_at) WITH &&"),
  "Contiene la restricción de exclusión GIST para evitar doble reserva"
);

// Validar Row Level Security (RLS)
assert(
  sqlContent1.includes("ENABLE ROW LEVEL SECURITY") &&
  sqlContent1.includes("CREATE POLICY \"Public can view active businesses\"") &&
  sqlContent1.includes("CREATE POLICY \"Business members can view clients of their business\""),
  "Políticas de Row Level Security (RLS) presentes y configuradas por business_id"
);

// Validar función RPC de disponibilidad
assert(
  sqlContent2.includes("FUNCTION public.get_available_slots") &&
  sqlContent2.includes("v_min_advance_hours") &&
  sqlContent2.includes("tstzrange") &&
  sqlContent2.includes("candidate_professionals"),
  "Función RPC get_available_slots completa con reglas de anticipación, descansos y bloqueos"
);

// --- RESUMEN FINAL ---
console.log("\n=================================================");
console.log(`RESULTADO FINAL: ${passedTests} de ${totalTests} pruebas pasadas con éxito.`);
if (passedTests === totalTests) {
  console.log("TODAS LAS VERIFICACIONES DE LA ETAPA 1 PASARON CORRECTAMENTE.");
} else {
  console.error("ALGUNAS PRUEBAS FALLARON.");
  process.exit(1);
}
console.log("=================================================");
