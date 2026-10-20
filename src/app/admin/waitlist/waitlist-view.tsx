"use client";

import * as React from "react";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";
import { updateWaitlistStatus, deleteWaitlistEntry, type WaitlistActionResult } from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Clock,
  MessageCircle,
  Bell,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Calendar,
  Sparkles,
} from "lucide-react";
import type { WaitlistStatus } from "@/types/database";

interface WaitlistViewProps {
  business: any;
  waitlist: any[];
  hasRecentCancellations: boolean;
}

export function WaitlistView({
  business,
  waitlist: initialWaitlist,
  hasRecentCancellations,
}: WaitlistViewProps) {
  const [waitlist, setWaitlist] = React.useState(initialWaitlist);
  const [feedback, setFeedback] = React.useState<WaitlistActionResult | null>(null);

  const pendingWaitlist = waitlist.filter((w) => w.status === "waiting");

  const getStatusBadge = (status: WaitlistStatus) => {
    switch (status) {
      case "waiting":
        return <Badge variant="warning">En Espera</Badge>;
      case "notified":
        return <Badge variant="default">Avisado</Badge>;
      case "booked":
        return <Badge variant="success">Cupo Tomado</Badge>;
      case "cancelled":
      default:
        return <Badge variant="secondary">Cancelado</Badge>;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lista de Espera</h1>
        <p className="text-xs text-neutral-500 mt-1">
          Clientes interesados en tomar cupos liberados. Ordenados por antigüedad (&quot;primero en llegar, primero en ser atendido&quot;).
        </p>
      </div>

      {/* Alerta Destacada si se liberó un cupo recientemente */}
      {hasRecentCancellations && pendingWaitlist.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-amber-900 dark:text-amber-200">
              ¡Se ha liberado un horario recientemente en tu local!
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
              Hay {pendingWaitlist.length} clientes en espera esperando disponibilidad. Usa el botón &quot;Avisar por WhatsApp&quot; en el primer cliente para ofrecerle el cupo.
            </p>
          </div>
        </div>
      )}

      {/* Alertas */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            feedback.error
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}
        >
          <span>{feedback.error || feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="underline">
            Cerrar
          </button>
        </div>
      )}

      {/* Listado de Espera */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Solicitudes en Espera ({waitlist.length})</span>
            <span className="text-xs font-normal text-neutral-500">
              {pendingWaitlist.length} pendientes
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {waitlist.length === 0 ? (
            <div className="py-12 text-center text-sm text-neutral-400 space-y-2">
              <Clock className="w-8 h-8 mx-auto text-neutral-300" />
              <p>No hay solicitudes en lista de espera en este momento.</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {waitlist.map((item, index) => {
                const client = item.clients;
                const service = item.service_variants;
                const prof = item.professionals;

                const whatsappUrl = client?.phone
                  ? buildWhatsAppLink(
                      client.phone,
                      "¡Hola {nombre}! 👋 Se ha liberado un cupo para *{servicio}* en {negocio}. Para tomar este cupo de inmediato, ingresa aquí: {enlace_gestion}",
                      {
                        nombre: client.full_name,
                        servicio: service?.name || "tu servicio solicitado",
                        negocio: business.name,
                        enlace_gestion: `${typeof window !== "undefined" ? window.location.origin : ""}/${business.slug}`,
                      }
                    )
                  : "";

                return (
                  <div
                    key={item.id}
                    className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-pink-600 bg-pink-50 dark:bg-pink-950/40 px-2 py-0.5 rounded">
                          #{index + 1} en fila
                        </span>
                        <p className="font-bold text-sm text-neutral-900 dark:text-white">
                          {client?.full_name || "Cliente"}
                        </p>
                        {getStatusBadge(item.status)}
                      </div>

                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        <strong>Servicio:</strong> {service?.name || "Cualquiera"} •{" "}
                        <strong>Estilista:</strong> {prof?.name || "Cualquiera"}
                      </p>

                      <p className="text-xs text-neutral-500 flex items-center gap-2">
                        <span>RUT: {client?.rut || "N/A"}</span>
                        <span>•</span>
                        <span>Tel: {client?.phone || "N/A"}</span>
                        <span>•</span>
                        <span>
                          Rango: {item.preferred_date_start} al {item.preferred_date_end}
                        </span>
                      </p>

                      {item.notes && (
                        <p className="text-xs text-neutral-400 italic">
                          Nota: &quot;{item.notes}&quot;
                        </p>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 shrink-0">
                      {item.status === "waiting" && whatsappUrl && (
                        <Button
                          variant="whatsapp"
                          size="sm"
                          className="text-xs flex items-center gap-1.5"
                          onClick={async () => {
                            window.open(whatsappUrl, "_blank");
                            const res = await updateWaitlistStatus(item.id, "notified");
                            setFeedback(res);
                            setWaitlist((prev) =>
                              prev.map((w) =>
                                w.id === item.id ? { ...w, status: "notified" } : w
                              )
                            );
                          }}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Avisar por WhatsApp
                        </Button>
                      )}

                      {item.status === "waiting" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={async () => {
                            const res = await updateWaitlistStatus(item.id, "booked");
                            setFeedback(res);
                            setWaitlist((prev) =>
                              prev.map((w) =>
                                w.id === item.id ? { ...w, status: "booked" } : w
                              )
                            );
                          }}
                        >
                          Marcar Cupo Tomado
                        </Button>
                      )}

                      <button
                        onClick={async () => {
                          if (confirm("¿Eliminar solicitud de lista de espera?")) {
                            const res = await deleteWaitlistEntry(item.id);
                            setFeedback(res);
                            setWaitlist((prev) => prev.filter((w) => w.id !== item.id));
                          }
                        }}
                        className="text-neutral-400 hover:text-red-600 p-2 cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
