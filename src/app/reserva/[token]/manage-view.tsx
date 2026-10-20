"use client";

import * as React from "react";
import Link from "next/link";
import { formatCLP } from "@/lib/utils/chile";
import { formatChileanDate, formatChileanTime } from "@/lib/utils/dates";
import { downloadICSFile } from "@/lib/utils/calendar";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";
import { cancelAppointmentByToken } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Clock,
  User,
  Scissors,
  MapPin,
  Download,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface ManageViewProps {
  appointment: any;
  business: any;
  professional: any;
  variant: any;
  client: any;
}

export function ManageView({
  appointment,
  business,
  professional,
  variant,
  client,
}: ManageViewProps) {
  const [showCancelPrompt, setShowCancelPrompt] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState("");
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ error?: string; success?: string } | null>(null);

  const rules = business.booking_rules || {};
  const limitHours = rules.cancellation_limit_hours ?? 24;

  const startsAt = new Date(appointment.starts_at).getTime();
  const hoursRemaining = (startsAt - Date.now()) / (1000 * 60 * 60);
  const canCancel =
    appointment.status === "confirmed" && hoursRemaining >= limitHours;

  const isCancelled = appointment.status === "cancelled";
  const isCompleted = appointment.status === "completed";

  const handleCancel = async () => {
    setIsCancelling(true);
    setFeedback(null);
    try {
      const res = await cancelAppointmentByToken(appointment.cancel_token, cancelReason);
      if (res.error) {
        setFeedback({ error: res.error });
      } else {
        setFeedback({ success: res.message });
        setShowCancelPrompt(false);
      }
    } catch (err: any) {
      setFeedback({ error: err.message || "Error al cancelar." });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDownloadICS = () => {
    downloadICSFile(`cita-${business.slug}`, {
      title: `${variant?.name || "Servicio"} en ${business.name}`,
      description: `Cita con ${professional?.name || "Profesional"}. Dirección: ${business.address}. Pago en el local: ${formatCLP(appointment.total_price_clp)}.`,
      location: business.address,
      startsAt: appointment.starts_at,
      endsAt: appointment.ends_at,
      url: window.location.href,
    });
  };

  const whatsappUrl = buildWhatsAppLink(
    business.whatsapp_number,
    "Hola {negocio}, te escribo respecto a mi cita de *{servicio}* programada para el *{fecha}* a las *{hora}*. Mi nombre es {nombre}.",
    {
      negocio: business.name,
      servicio: variant?.name || "Servicio",
      fecha: formatChileanDate(appointment.starts_at, "dd/MM/yyyy"),
      hora: formatChileanTime(appointment.starts_at),
      nombre: client?.full_name || "",
    }
  );

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Cabecera del Portal */}
        <div className="text-center space-y-2">
          <Link
            href={`/${business.slug}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-pink-600 hover:underline"
          >
            ← Volver al sitio de {business.name}
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Gestión de tu Cita
          </h1>
          <p className="text-xs text-neutral-500">
            Reserva #{appointment.id.slice(0, 8)} • Sin necesidad de contraseña
          </p>
        </div>

        {feedback?.error && (
          <div className="p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{feedback.error}</span>
          </div>
        )}

        {feedback?.success && (
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback.success}</span>
          </div>
        )}

        {/* Tarjeta de Estado y Resumen */}
        <Card className="border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden">
          <div
            className={`p-6 text-white text-center space-y-1 ${
              isCancelled
                ? "bg-neutral-800"
                : isCompleted
                ? "bg-emerald-700"
                : "bg-gradient-to-r from-pink-600 to-rose-600"
            }`}
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider mb-1">
              {isCancelled ? (
                <>
                  <XCircle className="w-3.5 h-3.5" /> Cancelada
                </>
              ) : isCompleted ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Completada
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" /> Cita Confirmada
                </>
              )}
            </div>
            <h2 className="text-xl font-extrabold">{variant?.name || "Servicio"}</h2>
            <p className="text-xs opacity-90">{business.name}</p>
          </div>

          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-neutral-500 font-medium">Fecha y hora</span>
                <p className="font-bold text-sm text-neutral-800 dark:text-neutral-200">
                  {formatChileanDate(appointment.starts_at)}
                </p>
                <p className="text-pink-600 font-semibold">
                  A las {formatChileanTime(appointment.starts_at)}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-neutral-500 font-medium">Profesional asignado</span>
                <p className="font-bold text-sm text-neutral-800 dark:text-neutral-200">
                  {professional?.name || "Equipo del salón"}
                </p>
                <p className="text-neutral-400">
                  {professional?.specialties?.join(", ") || "Especialista"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-neutral-500 font-medium">Dirección del local</span>
                <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {business.address}
                </p>
                <p className="text-neutral-400">{business.city || "Santiago"}</p>
              </div>

              <div className="space-y-1">
                <span className="text-neutral-500 font-medium">Monto a pagar</span>
                <p className="font-extrabold text-base text-pink-600">
                  {formatCLP(appointment.total_price_clp)}
                </p>
                <p className="text-[11px] text-neutral-400">Pago en recepción al término</p>
              </div>
            </div>

            {/* Motivo de cancelación si aplica */}
            {isCancelled && appointment.cancel_reason && (
              <div className="p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-600 dark:text-neutral-300">
                <strong>Motivo de cancelación:</strong> {appointment.cancel_reason}
              </div>
            )}

            {/* Acciones principales */}
            {!isCancelled && !isCompleted && (
              <div className="space-y-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleDownloadICS}
                  className="w-full flex items-center justify-center gap-2 text-xs"
                >
                  <Download className="w-4 h-4" />
                  Agregar a mi Calendario (.ics / Google)
                </Button>

                {whatsappUrl && (
                  <Button
                    variant="whatsapp"
                    onClick={() => window.open(whatsappUrl, "_blank")}
                    className="w-full flex items-center justify-center gap-2 text-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Contactar al local por WhatsApp
                  </Button>
                )}

                {/* Zona de Cancelación */}
                {!showCancelPrompt ? (
                  <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center text-xs">
                    <span className="text-neutral-500">
                      ¿No podrás asistir a tu cita?
                    </span>
                    {canCancel ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowCancelPrompt(true)}
                        className="text-xs"
                      >
                        Cancelar cita
                      </Button>
                    ) : (
                      <span className="text-neutral-400 italic">
                        Plazo para cancelar online vencido ({limitHours}h antes)
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 space-y-3 text-xs">
                    <p className="font-bold text-red-700 dark:text-red-300">
                      ¿Seguro que deseas cancelar tu cita?
                    </p>
                    <Textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Por favor indícanos brevemente el motivo de tu cancelación..."
                      rows={2}
                      className="text-xs bg-white dark:bg-neutral-900"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCancelPrompt(false)}
                      >
                        Volver
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        isLoading={isCancelling}
                        onClick={handleCancel}
                      >
                        Confirmar Cancelación
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isCancelled && (
              <div className="text-center pt-2">
                <Link href={`/${business.slug}`} className="block w-full">
                  <Button className="w-full">
                    Agendar una nueva cita en {business.name}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
