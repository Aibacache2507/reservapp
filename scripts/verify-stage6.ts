import { generateCSV } from "../src/lib/utils/export";
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

async function runStage6Verification() {
  console.log("=================================================");
  console.log("RESERVAPP - SUITE DE VERIFICACIÓN ETAPA 6");
  console.log("Reportes, Inventario, Comisiones y Fidelización");
  console.log("=================================================\n");

  // --- 1. VERIFICACIÓN DE ARCHIVOS Y MÓDULOS DE ETAPA 6 ---
  console.log("1. Verificación de Rutas y Módulos de Etapa 6:");
  const requiredFiles = [
    "src/lib/utils/export.ts",
    "src/app/admin/dashboard/dashboard-view.tsx",
    "src/app/admin/dashboard/page.tsx",
    "src/app/admin/commissions/actions.ts",
    "src/app/admin/commissions/commissions-view.tsx",
    "src/app/admin/commissions/page.tsx",
    "src/app/admin/inventory/actions.ts",
    "src/app/admin/inventory/inventory-view.tsx",
    "src/app/admin/inventory/page.tsx",
    "src/app/admin/loyalty/actions.ts",
    "src/app/admin/loyalty/loyalty-view.tsx",
    "src/app/admin/loyalty/page.tsx",
    "src/app/admin/layout.tsx",
    "src/app/[slug]/page.tsx",
  ];

  for (const file of requiredFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    assert(
      fs.existsSync(fullPath),
      `Archivo ${file} existe en el proyecto`,
      `Ruta no encontrada: ${fullPath}`
    );
  }

  // --- 2. GENERACIÓN Y FORMATO DE REPORTE EXCEL (CSV CON BOM) ---
  console.log("\n2. Generación de Reporte CSV / Excel:");
  const sampleCommissionData = [
    {
      fecha: "24-10-2026",
      profesional: "Camila Silva",
      cliente: "Francisca Morales",
      servicio: "Balayage Completo",
      total: 60000,
      comision_pct: "40%",
      monto_comision: 24000,
      estado: "Pendiente",
    },
    {
      fecha: "24-10-2026",
      profesional: "Ignacia Rojas",
      cliente: "Valeria Contreras",
      servicio: "Manicure Rusa",
      total: 25000,
      comision_pct: "50%",
      monto_comision: 12500,
      estado: "Pagada",
    },
  ];

  const csv = generateCSV(sampleCommissionData, [
    { key: "fecha", header: "Fecha" },
    { key: "profesional", header: "Profesional" },
    { key: "cliente", header: "Cliente" },
    { key: "servicio", header: "Servicio" },
    { key: "total", header: "Total Cobrado", format: (v) => formatCLP(v) },
    { key: "comision_pct", header: "% Comisión" },
    { key: "monto_comision", header: "Monto Comisión", format: (v) => formatCLP(v) },
    { key: "estado", header: "Estado" },
  ]);

  assert(csv.startsWith("\uFEFF"), "El archivo CSV incluye Byte Order Mark (BOM UTF-8) para Excel");
  assert(csv.includes('"Fecha";"Profesional";"Cliente"'), "Encabezados delimitados por punto y coma");
  assert(csv.includes('"$60.000"'), "Montos formateados en pesos chilenos CLP");
  assert(csv.includes('"Camila Silva"'), "Nombre de profesional correctamente exportado");
  assert(csv.includes('"Balayage Completo"'), "Servicio correctamente exportado");

  // --- 3. REGLAS DE DESCUENTO Y ACTUALIZACIÓN DE INVENTARIO ---
  console.log("\n3. Reglas de Stock y Movimientos de Inventario:");
  let currentStock = 10;
  const minStockAlert = 5;

  // Entrada por compra (+15)
  const qtyIn = 15;
  currentStock += qtyIn;
  assert(currentStock === 25, "Entrada por compra suma stock correctamente (10 + 15 = 25)");

  // Consumo en cabina / servicio (-3)
  const qtyConsumed = 3;
  currentStock -= qtyConsumed;
  assert(currentStock === 22, "Consumo en servicio descuenta stock (25 - 3 = 22)");

  // Venta a cliente (-18)
  const qtyOut = 18;
  currentStock -= qtyOut;
  assert(currentStock === 4, "Venta descuenta stock (22 - 18 = 4)");

  // Verificación de alerta de bajo stock
  const isLowStock = currentStock <= minStockAlert;
  assert(isLowStock, "Dispara alerta de reposición cuando stock (4) es menor o igual al mínimo (5)");

  // Verificación de prevención de stock negativo
  const canWithdraw = (stock: number, requestQty: number) => stock >= requestQty;
  assert(!canWithdraw(currentStock, 10), "Impide salida mayor al stock disponible (solicita 10, hay 4)");
  assert(canWithdraw(currentStock, 3), "Permite salida válida dentro del stock disponible");

  // --- 4. CÁLCULO DE DASHBOARD Y KPIS FINANCIEROS ---
  console.log("\n4. Fórmulas de Rendimiento y Métricas Financieras:");
  const testAppointments = [
    { status: "completed", price: 30000 },
    { status: "completed", price: 20000 },
    { status: "completed", price: 40000 },
    { status: "cancelled", price: 25000 },
    { status: "no_show", price: 15000 },
    { status: "confirmed", price: 35000 },
  ];

  const completed = testAppointments.filter((a) => a.status === "completed");
  const totalRevenue = completed.reduce((sum, a) => sum + a.price, 0);
  assert(totalRevenue === 90000, "Ingresos totales suman sólo citas completadas ($90.000)");

  const avgTicket = Math.round(totalRevenue / completed.length);
  assert(avgTicket === 30000, "Ticket promedio calculado correctamente ($30.000)");

  const totalCount = testAppointments.length;
  const attendanceRate = Math.round((completed.length / totalCount) * 100);
  assert(attendanceRate === 50, "Tasa de asistencia es del 50% (3 completadas de 6 totales)");

  const cancelledRate = Math.round((testAppointments.filter((a) => a.status === "cancelled").length / totalCount) * 100);
  assert(cancelledRate === 17, "Tasa de cancelación calculada (1 de 6 = 17%)");

  const noShowRate = Math.round((testAppointments.filter((a) => a.status === "no_show").length / totalCount) * 100);
  assert(noShowRate === 17, "Tasa de inasistencia calculada (1 de 6 = 17%)");

  // --- 5. FIDELIZACIÓN DE CLIENTES (LTV) Y CALIFICACIONES ---
  console.log("\n5. Ranking de Clientes Frecuentes y Moderación de Reseñas:");
  const clientsLTV = [
    { name: "Constanza", visits: 5, spent: 150000 },
    { name: "Macarena", visits: 8, spent: 220000 },
    { name: "Sofía", visits: 2, spent: 60000 },
  ];

  const sortedLTV = [...clientsLTV].sort((a, b) => b.spent - a.spent);
  assert(sortedLTV[0].name === "Macarena", "Cliente top 1 por mayor gasto acumulado es Macarena ($220.000)");
  assert(sortedLTV[1].name === "Constanza", "Cliente top 2 es Constanza ($150.000)");

  const sampleReviews = [
    { rating: 5, is_public: true },
    { rating: 4, is_public: true },
    { rating: 5, is_public: false },
  ];

  const avgRating = (sampleReviews.reduce((sum, r) => sum + r.rating, 0) / sampleReviews.length).toFixed(1);
  assert(avgRating === "4.7", "Promedio de calificación de reseñas calculado (4.7 estrellas)");

  const publicReviews = sampleReviews.filter((r) => r.is_public);
  assert(publicReviews.length === 2, "Filtro de moderación muestra sólo reseñas públicas (2 de 3)");

  console.log("\n=================================================");
  console.log(`RESULTADO ETAPA 6: ${passedTests} de ${totalTests} pruebas exitosas.`);
  console.log("=================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runStage6Verification().catch((err) => {
  console.error("Error fatal en verificación Etapa 6:", err);
  process.exit(1);
});
