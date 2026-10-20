import * as React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ReviewForm } from "./review-form";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, Clock } from "lucide-react";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function AppointmentReviewPage({ params }: PageProps) {
  const { token } = await params;
  const supabase = await createClient();

  // 1. Consultar cita
  const { data: apt }: any = await supabase
    .from("appointments")
    .select(`
      id,
      status,
      starts_at,
      cancel_token,
      businesses (
        name
      ),
      professionals (
        name
      ),
      services (
        name
      )
    `)
    .eq("cancel_token", token)
    .maybeSingle();

  if (!apt) {
    notFound();
  }

  // 2. Verificar si ya existe reseña
  const { data: existingReview } = await supabase
    .from("reviews")
    .select("rating, comment, created_at, business_reply")
    .eq("appointment_id", apt.id)
    .maybeSingle();

  // 3. Si la cita NO está completada, mostrar pantalla explicativa
  if (apt.status !== "completed") {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center border-neutral-200 dark:border-neutral-800 shadow-md">
          <CardContent className="p-8 space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold">Cita aún no realizada</h2>
              <p className="text-xs text-neutral-500">
                Solo puedes calificar y dejar una reseña una vez que tu atención haya sido <strong>completada</strong> en el local.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href={`/reserva/${token}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-pink-600 hover:text-pink-700"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a los detalles de mi reserva</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col justify-center items-center p-4">
      <ReviewForm
        token={token}
        businessName={apt.businesses?.name || "el local"}
        serviceName={apt.services?.name || "Servicio"}
        professionalName={apt.professionals?.name || "Especialista"}
        existingReview={existingReview}
      />
    </div>
  );
}
