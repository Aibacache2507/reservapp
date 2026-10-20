import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookingWizard } from "./booking-wizard";
import { formatCLP } from "@/lib/utils/chile";
import {
  MapPin,
  Phone,
  MessageCircle,
  Star,
  Scissors,
  Users,
  Image as ImageIcon,
  ShieldCheck,
  Clock,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicBusinessPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // 1. Consultar el negocio por slug
  const { data: business }: any = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!business || business.status !== "active") {
    notFound();
  }

  // 2. Consultar entidades relacionadas
  const [
    { data: branches },
    { data: categories },
    { data: services },
    { data: variants },
    { data: professionals },
    { data: profServices },
    { data: reviews },
    { data: gallery },
  ]: any = await Promise.all([
    supabase.from("branches").select("*").eq("business_id", business.id).eq("is_active", true),
    supabase.from("service_categories").select("*").eq("business_id", business.id).eq("is_active", true).order("display_order"),
    supabase.from("services").select("*").eq("business_id", business.id).eq("is_active", true).order("display_order"),
    supabase.from("service_variants").select("*").eq("business_id", business.id).eq("is_active", true).order("display_order"),
    supabase.from("professionals").select("*").eq("business_id", business.id).eq("is_active", true).order("display_order"),
    supabase.from("professional_services").select("*").eq("business_id", business.id).eq("is_active", true),
    supabase.from("reviews").select("*").eq("business_id", business.id).eq("is_public", true).order("created_at", { ascending: false }).limit(6),
    supabase.from("gallery_images").select("*").eq("business_id", business.id).order("display_order").limit(8),
  ]);

  // Anidar variantes en los servicios
  const servicesWithVariants = (services || []).map((srv: any) => ({
    ...srv,
    service_variants: (variants || []).filter((v: any) => v.service_id === srv.id),
  }));

  const mainBranch = (branches || []).find((b: any) => b.is_main) || (branches || [])[0];

  // Cálculo de promedio de reseñas
  const reviewsList = reviews || [];
  const averageRating =
    reviewsList.length > 0
      ? (
          reviewsList.reduce((acc: number, r: any) => acc + (r.rating || 5), 0) /
          reviewsList.length
        ).toFixed(1)
      : "5.0";

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      {/* Header / Hero del Negocio */}
      <header
        className="relative py-12 px-4 sm:px-6 lg:px-8 border-b border-neutral-200 dark:border-neutral-800"
        style={{
          background: `linear-gradient(135deg, ${business.brand_color || "#ec4899"}15 0%, #ffffff 100%)`,
        }}
      >
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
          {/* Logo del local */}
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0 overflow-hidden"
            style={{ backgroundColor: business.brand_color || "#ec4899" }}
          >
            {business.logo_url ? (
              <img
                src={business.logo_url}
                alt={business.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Sparkles className="w-10 h-10" />
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <Badge variant="default" className="text-xs uppercase tracking-wider">
                {business.rubro?.replace(/_/g, " ")}
              </Badge>
              <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{averageRating}</span>
                <span className="text-neutral-400">({reviewsList.length || 12} reseñas)</span>
              </div>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              {business.name}
            </h1>

            <p className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center justify-center md:justify-start gap-1.5">
              <MapPin className="w-4 h-4 text-pink-600 shrink-0" />
              <span>{mainBranch?.address || business.address}, {business.city}</span>
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                {business.phone}
              </span>
              <a
                href={`https://wa.me/${business.whatsapp_number}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-emerald-600 font-semibold hover:underline"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp Directo
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal: Wizard de Agendamiento */}
      <main className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Sección de Reserva */}
        <section id="reservar" className="space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">
              Reserva tu Hora Online
            </h2>
            <p className="text-sm text-neutral-500">
              Elige tu servicio, fecha y hora en sencillos pasos. Sin necesidad de registrarte.
            </p>
          </div>

          <BookingWizard
            business={business}
            categories={categories || []}
            services={servicesWithVariants}
            professionals={professionals || []}
            professionalServices={profServices || []}
            branches={branches || []}
          />
        </section>

        {/* Galería de Trabajos */}
        {gallery && gallery.length > 0 && (
          <section className="space-y-4 pt-6 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-pink-600" />
              <h3 className="text-lg font-bold">Galería de Trabajos</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {gallery.map((img: any) => (
                <div
                  key={img.id}
                  className="aspect-square rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 group relative"
                >
                  <img
                    src={img.image_url}
                    alt={img.caption || "Trabajo del salón"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {img.caption && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[11px] text-white truncate">{img.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Políticas y Garantía */}
        <section className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-neutral-800 dark:text-neutral-200">
            <ShieldCheck className="w-4 h-4 text-pink-600" />
            Políticas de Atención y Agendamiento
          </div>
          <ul className="text-xs text-neutral-500 space-y-1.5 list-disc pl-4">
            <li>
              <strong>Pago en el local:</strong> No cobramos nada por adelantado. El pago se efectúa al finalizar tu servicio directamente en recepción.
            </li>
            <li>
              <strong>Plazo de cancelación:</strong> Puedes reprogramar o cancelar con hasta {business.booking_rules?.cancellation_limit_hours || 24} horas de anticipación desde el enlace que recibirás en tu correo.
            </li>
            <li>
              <strong>Puntualidad:</strong> Te sugerimos llegar 5 minutos antes para que disfrutes de tu atención sin prisas.
            </li>
          </ul>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 py-8 px-4 text-center text-xs text-neutral-400">
        <p>© {new Date().getFullYear()} {business.name}. Todos los derechos reservados.</p>
        <p className="mt-1">
          Desarrollado con <strong className="text-pink-600">RESERVAPP</strong> • Software de Agendamiento en Chile
        </p>
      </footer>
    </div>
  );
}
