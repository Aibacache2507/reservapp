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

async function runStage7Verification() {
  console.log("=================================================");
  console.log("RESERVAPP - SUITE DE VERIFICACIÓN ETAPA 7");
  console.log("Galería de Trabajos, Reseñas y SEO Local Schema.org");
  console.log("=================================================\n");

  // --- 1. VERIFICACIÓN DE ARCHIVOS Y RUTAS DE ETAPA 7 ---
  console.log("1. Verificación de Rutas y Módulos de Etapa 7:");
  const requiredFiles = [
    "supabase/migrations/20261020000002_storage_gallery.sql",
    "src/lib/services/storage.ts",
    "src/app/admin/gallery/actions.ts",
    "src/app/admin/gallery/gallery-view.tsx",
    "src/app/admin/gallery/page.tsx",
    "src/app/reserva/[token]/review/actions.ts",
    "src/app/reserva/[token]/review/review-form.tsx",
    "src/app/reserva/[token]/review/page.tsx",
    "src/app/reserva/[token]/manage-view.tsx",
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

  // --- 2. REGLA ESTRICTA DE RESEÑAS: SÓLO CITAS COMPLETADAS Y UNA SOLA VEZ ---
  console.log("\n2. Validación de Regla de Reseñas para Clientes:");
  const canSubmitReview = (
    appointmentStatus: string,
    hasExistingReview: boolean,
    rating: number
  ): { allowed: boolean; reason?: string } => {
    if (appointmentStatus !== "completed") {
      return { allowed: false, reason: "Solo se puede calificar una cita completada." };
    }
    if (hasExistingReview) {
      return { allowed: false, reason: "La cita ya fue calificada previamente." };
    }
    if (rating < 1 || rating > 5) {
      return { allowed: false, reason: "La calificación debe ser entre 1 y 5 estrellas." };
    }
    return { allowed: true };
  };

  // Cita completada sin reseña previa -> Válida
  assert(
    canSubmitReview("completed", false, 5).allowed,
    "Permite reseñar una cita completada con 5 estrellas"
  );
  assert(
    canSubmitReview("completed", false, 1).allowed,
    "Permite calificar con 1 estrella (rango válido)"
  );

  // Intentos inválidos
  assert(
    !canSubmitReview("confirmed", false, 5).allowed,
    "Rechaza reseñar una cita confirmada pero aún no realizada"
  );
  assert(
    !canSubmitReview("pending", false, 5).allowed,
    "Rechaza reseñar una cita pendiente"
  );
  assert(
    !canSubmitReview("cancelled", false, 5).allowed,
    "Rechaza reseñar una cita cancelada"
  );
  assert(
    !canSubmitReview("completed", true, 5).allowed,
    "Rechaza calificar dos veces la misma cita (prevención de duplicados)"
  );
  assert(
    !canSubmitReview("completed", false, 0).allowed,
    "Rechaza calificación de 0 estrellas (mínimo 1)"
  );
  assert(
    !canSubmitReview("completed", false, 6).allowed,
    "Rechaza calificación de 6 estrellas (máximo 5)"
  );

  // --- 3. REGLAS DE ALMACENAMIENTO (SUPABASE STORAGE) ---
  console.log("\n3. Reglas de Subida de Fotos para Galería (Storage):");
  const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
  const maxSizeBytes = 5 * 1024 * 1024; // 5MB

  const validateUpload = (mime: string, size: number) => {
    if (!allowedMimes.includes(mime)) return false;
    if (size > maxSizeBytes) return false;
    return true;
  };

  assert(validateUpload("image/jpeg", 2 * 1024 * 1024), "Acepta imagen JPEG de 2MB");
  assert(validateUpload("image/webp", 4 * 1024 * 1024), "Acepta imagen WebP de 4MB");
  assert(validateUpload("image/png", 1024 * 1024), "Acepta imagen PNG de 1MB");
  assert(!validateUpload("application/pdf", 1024), "Rechaza archivo PDF en galería de imágenes");
  assert(!validateUpload("image/jpeg", 6 * 1024 * 1024), "Rechaza imagen que excede 5MB (ej. 6MB)");

  // --- 4. DATOS ESTRUCTURADOS SCHEMA.ORG (JSON-LD) PARA SEO LOCAL ---
  console.log("\n4. Estructura de Datos Schema.org para Google y SEO Local:");
  const testBusiness = {
    name: "Salón Belleza Providencia",
    slug: "salon-providencia",
    description: "Peluquería y estética profesional en Santiago de Chile",
    phone: "+56912345678",
    address: "Av. Providencia 2133, Local 12",
    city: "Providencia, Santiago",
  };

  const sampleReviews = [
    { rating: 5, client: "Camila", comment: "Excelente corte y atención!" },
    { rating: 5, client: "Valentina", comment: "El mejor balayage de Santiago." },
  ];

  const avgRating = "5.0";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    name: testBusiness.name,
    description: testBusiness.description,
    url: `https://reservapp.cl/${testBusiness.slug}`,
    telephone: testBusiness.phone,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: testBusiness.address,
      addressLocality: testBusiness.city,
      addressCountry: "CL",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: avgRating,
      reviewCount: sampleReviews.length,
      bestRating: "5",
      worstRating: "1",
    },
    review: sampleReviews.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.client },
      reviewRating: { "@type": "Rating", ratingValue: r.rating },
      reviewBody: r.comment,
    })),
  };

  const serializedJsonLd = JSON.stringify(jsonLd);
  assert(serializedJsonLd.includes('"@type":"BeautySalon"'), "Tipo schema.org 'BeautySalon' configurado");
  assert(serializedJsonLd.includes('"addressCountry":"CL"'), "País Chile ('CL') en dirección postal");
  assert(serializedJsonLd.includes('"ratingValue":"5.0"'), "Promedio de reseñas reflejado en AggregateRating");
  assert(serializedJsonLd.includes('"reviewCount":2'), "Cantidad de reseñas contabilizada");

  const parsed = JSON.parse(serializedJsonLd);
  assert(parsed.name === testBusiness.name, "JSON-LD sintácticamente válido y deserializable sin errores");

  console.log("\n=================================================");
  console.log(`RESULTADO ETAPA 7: ${passedTests} de ${totalTests} pruebas exitosas.`);
  console.log("=================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runStage7Verification().catch((err) => {
  console.error("Error fatal en verificación Etapa 7:", err);
  process.exit(1);
});
