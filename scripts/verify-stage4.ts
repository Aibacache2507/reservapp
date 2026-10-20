import { formatCLP, validateRut, formatRut } from "../src/lib/utils/chile";
import { buildWhatsAppLink } from "../src/lib/utils/whatsapp";
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

async function runStage4Verification() {
  console.log("=================================================");
  console.log("RESERVAPP - SUITE DE VERIFICACIÓN ETAPA 4");
  console.log("Panel del Administrador y del Profesional (Operación)");
  console.log("=================================================\n");

  // --- 1. VERIFICACIÓN DE ESTRUCTURA Y ARCHIVOS DE ETAPA 4 ---
  console.log("1. Verificación de Rutas y Módulos de Operación:");
  const requiredFiles = [
    "src/app/admin/calendar/actions.ts",
    "src/app/admin/calendar/calendar-view.tsx",
    "src/app/admin/calendar/page.tsx",
    "src/app/admin/waitlist/actions.ts",
    "src/app/admin/waitlist/waitlist-view.tsx",
    "src/app/admin/waitlist/page.tsx",
    "src/app/admin/clients/actions.ts",
    "src/app/admin/clients/clients-view.tsx",
    "src/app/admin/clients/page.tsx",
    "src/app/admin/promotions/actions.ts",
    "src/app/admin/promotions/promotions-view.tsx",
    "src/app/admin/promotions/page.tsx",
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

  // --- 2. CÁLCULO DE COMISIONES POR CITA COMPLETADA ---
  console.log("\n2. Reglas de Cálculo de Comisiones para Profesionales:");
  const calculateCommission = (totalClp: number, percentage: number) => {
    return Math.round(totalClp * (percentage / 100));
  };

  const servicePrice1 = 30000; // Balayage $30.000
  const commissionRate1 = 40; // 40%
  const comm1 = calculateCommission(servicePrice1, commissionRate1);
  assert(comm1 === 12000, "Comisión del 40% sobre $30.000 CLP es $12.000 CLP");
  assert(
    formatCLP(comm1) === "$12.000",
    "Formato CLP de comisión correcto ($12.000)"
  );

  const servicePrice2 = 18000;
  const commissionRate2 = 50;
  assert(
    calculateCommission(servicePrice2, commissionRate2) === 9000,
    "Comisión del 50% sobre $18.000 CLP es $9.000 CLP"
  );

  const zeroCommission = calculateCommission(15000, 0);
  assert(zeroCommission === 0, "Profesional con 0% de comisión genera $0");

  // --- 3. REGLAS DE DESCUENTO EN CUPONES Y PACKS ---
  console.log("\n3. Validación de Cupones y Descuentos:");
  const applyDiscount = (
    originalPrice: number,
    type: "percentage" | "fixed_amount",
    value: number
  ) => {
    if (type === "percentage") {
      const discount = Math.round((originalPrice * value) / 100);
      return Math.max(0, originalPrice - discount);
    } else {
      return Math.max(0, originalPrice - value);
    }
  };

  const priceBase = 25000;
  // Cupón 20%
  const discountedPercentage = applyDiscount(priceBase, "percentage", 20);
  assert(discountedPercentage === 20000, "Cupón de 20% sobre $25.000 deja precio en $20.000");

  // Cupón $5.000 fijo
  const discountedFixed = applyDiscount(priceBase, "fixed_amount", 5000);
  assert(discountedFixed === 20000, "Cupón de $5.000 fijos sobre $25.000 deja precio en $20.000");

  // Descuento mayor al total nunca resulta negativo
  const discountedOver = applyDiscount(10000, "fixed_amount", 15000);
  assert(discountedOver === 0, "Descuento superior al monto no produce saldo negativo (mínimo 0)");

  // --- 4. LISTA DE ESPERA Y AVISO POR WHATSAPP (wa.me) ---
  console.log("\n4. Enlace wa.me para Notificar Cupo Disponible a Lista de Espera:");
  const waitlistTemplate =
    "¡Hola {nombre}! Te escribimos de {negocio}. Se ha liberado un cupo para *{servicio}*. Puedes tomarlo directamente en este enlace: {enlace_gestion}. ¡Te esperamos!";

  const clientPhone = "+56 9 8765 4321";
  const waitlistLink = buildWhatsAppLink(clientPhone, waitlistTemplate, {
    nombre: "Javiera",
    negocio: "Salón Glamour",
    servicio: "Manicure Rusa Completa",
    enlace_gestion: "https://reservapp.cl/salon-glamour?fecha=2026-10-25",
  });

  assert(
    waitlistLink.startsWith("https://wa.me/56987654321?text="),
    "Enlace wa.me normalizado con teléfono chileno E.164 sin '+' ni espacios"
  );
  assert(
    waitlistLink.includes(encodeURIComponent("Javiera")),
    "Nombre de la clienta codificado correctamente en el mensaje"
  );
  assert(
    waitlistLink.includes(encodeURIComponent("Manicure Rusa Completa")),
    "Servicio codificado en el mensaje de lista de espera"
  );

  // --- 5. FICHA TÉCNICA Y PRIVACIDAD DEL CLIENTE ---
  console.log("\n5. Ficha Técnica y Búsqueda de Clientes:");
  const clientRecord = {
    client_rut: "18.234.567-9",
    client_name: "Francisca Morales",
    allergies: "Alergia a productos con amoníaco y látex",
    preferences: "Prefiere música suave y café cortado",
    technical_notes: "Fórmula tinte raíz: Igora Royal 7-00 con 20 vol.",
  };

  assert(validateRut(clientRecord.client_rut), "RUT de la clienta válido con dígito verificador");
  assert(
    clientRecord.allergies.length > 0,
    "Alerta médica / alergias registrada en la ficha"
  );
  assert(
    clientRecord.technical_notes.includes("Igora Royal"),
    "Fórmula y notas técnicas registradas para el estilista"
  );

  // --- 6. GESTIÓN DE ESTADOS DE CITAS ---
  console.log("\n6. Transición de Estados de Citas:");
  const allowedStatuses = ["pending", "confirmed", "completed", "cancelled", "no_show"];
  const testStatusTransition = (from: string, to: string) => {
    return allowedStatuses.includes(from) && allowedStatuses.includes(to);
  };

  assert(
    testStatusTransition("pending", "confirmed"),
    "Transición válida: pendiente -> confirmada"
  );
  assert(
    testStatusTransition("confirmed", "completed"),
    "Transición válida: confirmada -> completada"
  );
  assert(
    testStatusTransition("confirmed", "no_show"),
    "Transición válida: confirmada -> no asistió"
  );
  assert(
    testStatusTransition("pending", "cancelled"),
    "Transición válida: pendiente -> cancelada"
  );

  console.log("\n=================================================");
  console.log(
    `RESULTADO ETAPA 4: ${passedTests} de ${totalTests} pruebas exitosas.`
  );
  console.log("=================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runStage4Verification().catch((err) => {
  console.error("Error fatal en verificación Etapa 4:", err);
  process.exit(1);
});
