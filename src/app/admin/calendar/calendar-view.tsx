"use client";

import * as React from "react";
import { formatCLP } from "@/lib/utils/chile";
import { formatChileanDate, formatChileanTime } from "@/lib/utils/dates";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";
import {
  createManualAppointment,
  updateAppointmentStatus,
  createScheduleBlock,
  deleteScheduleBlock,
  type CalendarActionResult,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Ban,
  Clock,
  User,
  Scissors,
  DollarSign,
  Phone,
  MessageCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Filter,
} from "lucide-react";
import type { AppointmentStatus } from "@/types/database";

interface CalendarViewProps {
  business: any;
  appointments: any[];
  professionals: any[];
  branches: any[];
  services: any[];
  scheduleBlocks: any[];
  currentRole: string;
  loggedProfessionalId: string | null;
}

export function CalendarView({
  business,
  appointments: initialAppointments,
  professionals,
  branches,
  services,
  scheduleBlocks: initialBlocks,
  currentRole,
  loggedProfessionalId,
}: CalendarViewProps) {
  // Estado de vista: Día o Semana
  const [viewMode, setViewMode] = React.useState<"day" | "week">("day");
  const [currentDate, setCurrentDate] = React.useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Filtros
  const isProfessionalOnly = currentRole === "professional";
  const [selectedProfId, setSelectedProfId] = React.useState<string>(
    isProfessionalOnly && loggedProfessionalId ? loggedProfessionalId : "all"
  );
  const [selectedBranchId, setSelectedBranchId] = React.useState<string>("all");

  // Modales
  const [selectedApt, setSelectedApt] = React.useState<any | null>(null);
  const [showNewAptModal, setShowNewAptModal] = React.useState(false);
  const [showBlockModal, setShowBlockModal] = React.useState(false);

  // Formularios
  const [feedback, setFeedback] = React.useState<CalendarActionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [finalPriceInput, setFinalPriceInput] = React.useState<number>(0);

  // Navegación de fechas
  const handlePrevDay = () => {
    const d = new Date(`${currentDate}T12:00:00`);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const d = new Date(`${currentDate}T12:00:00`);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d.toISOString().split("T")[0]);
  };

  const handleToday = () => {
    setCurrentDate(new Date().toISOString().split("T")[0]);
  };

  // Filtrado de citas
  const filteredAppointments = initialAppointments.filter((apt) => {
    const aptDate = apt.starts_at?.split("T")[0];
    if (viewMode === "day" && aptDate !== currentDate) return false;

    if (selectedProfId !== "all" && apt.professional_id !== selectedProfId) {
      return false;
    }
    if (selectedBranchId !== "all" && apt.branch_id !== selectedBranchId) {
      return false;
    }
    return true;
  });

  // Filtrado de bloqueos
  const filteredBlocks = initialBlocks.filter((b) => {
    const bDate = b.starts_at?.split("T")[0];
    if (viewMode === "day" && bDate !== currentDate) return false;
    if (selectedProfId !== "all" && b.professional_id && b.professional_id !== selectedProfId) {
      return false;
    }
    return true;
  });

  // Estado visual por cita
  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case "confirmed":
        return <Badge variant="default">Confirmada</Badge>;
      case "completed":
        return <Badge variant="success">Completada</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelada</Badge>;
      case "no_show":
        return <Badge variant="destructive">No Asistió</Badge>;
      case "pending":
      default:
        return <Badge variant="warning">Pendiente</Badge>;
    }
  };

  const getStatusBg = (status: AppointmentStatus) => {
    switch (status) {
      case "completed":
        return "border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-200";
      case "cancelled":
        return "border-neutral-200 bg-neutral-100/70 dark:bg-neutral-800/40 text-neutral-400 line-through";
      case "no_show":
        return "border-rose-300 bg-rose-50/60 dark:bg-rose-950/20 text-rose-950 dark:text-rose-200";
      case "confirmed":
      default:
        return "border-pink-300 bg-pink-50/60 dark:bg-pink-950/20 text-pink-950 dark:text-pink-200";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Barra Superior de Control de la Agenda */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Agenda Operativa
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            {isProfessionalOnly
              ? "Mi agenda diaria y clientes asignados"
              : "Control diario de citas, horarios y profesionales del local"}
          </p>
        </div>

        {/* Acciones de Crear Cita o Bloqueo */}
        <div className="flex items-center gap-2">
          {!isProfessionalOnly && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBlockModal(true)}
              className="flex items-center gap-1.5 text-xs"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Bloquear Horario</span>
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => setShowNewAptModal(true)}
            className="flex items-center gap-1.5 text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Cita Manual</span>
          </Button>
        </div>
      </div>

      {/* Alertas / Feedback */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl border text-xs ${
            feedback.error
              ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40"
              : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.error ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{feedback.error || feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="underline cursor-pointer">
            Cerrar
          </button>
        </div>
      )}

      {/* Barra de Filtros y Navegación de Fecha */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
        {/* Navegador de Fecha */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevDay} className="h-8 w-8 p-0">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday} className="text-xs h-8">
            Hoy
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextDay} className="h-8 w-8 p-0">
            <ChevronRight className="w-4 h-4" />
          </Button>

          <span className="font-semibold text-sm capitalize ml-2">
            {formatChileanDate(`${currentDate}T12:00:00`, "EEEE d 'de' MMMM, yyyy")}
          </span>
        </div>

        {/* Filtros de Profesional y Sucursal */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isProfessionalOnly && (
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-neutral-400" />
              <select
                value={selectedProfId}
                onChange={(e) => setSelectedProfId(e.target.value)}
                className="h-8 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2"
              >
                <option value="all">Todos los profesionales</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {branches.length > 1 && (
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="h-8 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2"
            >
              <option value="all">Todas las sucursales</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          {/* Switch Día / Semana */}
          <div className="inline-flex rounded-lg border border-neutral-200 dark:border-neutral-800 p-0.5 bg-neutral-100 dark:bg-neutral-800 text-xs">
            <button
              onClick={() => setViewMode("day")}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewMode === "day"
                  ? "bg-white dark:bg-neutral-900 font-bold shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Día
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewMode === "week"
                  ? "bg-white dark:bg-neutral-900 font-bold shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Semana
            </button>
          </div>
        </div>
      </div>

      {/* Contenido de la Agenda (Timeline de Horas) */}
      <div className="space-y-4">
        {/* Bloqueos Administrativos del Día */}
        {filteredBlocks.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-neutral-400 tracking-wider">
              Horarios Bloqueados:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {filteredBlocks.map((b) => (
                <div
                  key={b.id}
                  className="p-2.5 rounded-lg border border-dashed border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-amber-900 dark:text-amber-200">
                      {formatChileanTime(b.starts_at)} a {formatChileanTime(b.ends_at)}
                    </span>
                    <p className="text-neutral-500 text-[11px] truncate">{b.reason}</p>
                  </div>
                  {!isProfessionalOnly && (
                    <button
                      onClick={async () => {
                        const res = await deleteScheduleBlock(b.id);
                        setFeedback(res);
                      }}
                      className="text-neutral-400 hover:text-red-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Listado / Timeline de Citas */}
        {filteredAppointments.length === 0 ? (
          <Card className="border-dashed p-12 text-center text-sm text-neutral-400 space-y-2">
            <CalendarIcon className="w-8 h-8 mx-auto text-neutral-300" />
            <p>No hay citas programadas para este filtro o fecha.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewAptModal(true)}
              className="text-xs mt-2"
            >
              + Agendar Cita Manualmente
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAppointments.map((apt) => {
              const prof = professionals.find((p) => p.id === apt.professional_id);
              const client = apt.clients;
              const serviceName =
                apt.service_variants?.name || "Servicio";

              return (
                <div
                  key={apt.id}
                  onClick={() => {
                    setSelectedApt(apt);
                    setFinalPriceInput(apt.total_price_clp || 0);
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between ${getStatusBg(
                    apt.status
                  )}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-pink-600 shrink-0" />
                        {formatChileanTime(apt.starts_at)} - {formatChileanTime(apt.ends_at)}
                      </span>
                      {getStatusBadge(apt.status)}
                    </div>

                    <div className="space-y-0.5">
                      <p className="font-bold text-sm text-neutral-900 dark:text-white">
                        {client?.full_name || "Cliente"}
                      </p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        {serviceName}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-black/5 dark:border-white/5">
                      <span className="text-neutral-500">
                        Atiende: <strong>{prof?.name?.split(" ")[0] || "Estilista"}</strong>
                      </span>
                      <span className="font-bold text-pink-600">
                        {formatCLP(apt.total_price_clp)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL DETALLE DE CITA (OPERACIÓN, ESTADO Y PRECIO FINAL)
          ======================================================== */}
      {selectedApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <Card className="w-full max-w-lg bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-2xl relative">
            <button
              onClick={() => setSelectedApt(null)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedApt.status)}
                <span className="text-xs text-neutral-400 font-mono">
                  #{selectedApt.id.slice(0, 8)}
                </span>
              </div>
              <CardTitle className="text-lg">
                {selectedApt.clients?.full_name || "Detalle de Cita"}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 text-xs">
              {/* Información del Cliente */}
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 space-y-1.5 border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-700 dark:text-neutral-300">
                    RUT: {selectedApt.clients?.rut || "Sin RUT"}
                  </span>
                  {selectedApt.clients?.phone && (
                    <a
                      href={buildWhatsAppLink(
                        selectedApt.clients.phone,
                        "Hola {nombre}, te contactamos de {negocio} respecto a tu cita de hoy a las {hora}.",
                        {
                          nombre: selectedApt.clients?.full_name || "",
                          negocio: business.name,
                          hora: formatChileanTime(selectedApt.starts_at),
                        }
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-600 font-semibold hover:underline"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp Cliente
                    </a>
                  )}
                </div>
                <p className="text-neutral-500">
                  Teléfono: {selectedApt.clients?.phone || "Sin teléfono"} • {selectedApt.clients?.email || ""}
                </p>
                {selectedApt.client_notes && (
                  <p className="text-neutral-600 dark:text-neutral-400 italic pt-1">
                    Nota del cliente: &quot;{selectedApt.client_notes}&quot;
                  </p>
                )}
              </div>

              {/* Fecha y Profesional */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800">
                  <span className="text-neutral-400 text-[11px]">Horario</span>
                  <p className="font-bold mt-0.5">
                    {formatChileanTime(selectedApt.starts_at)} - {formatChileanTime(selectedApt.ends_at)}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800">
                  <span className="text-neutral-400 text-[11px]">Profesional</span>
                  <p className="font-bold mt-0.5">
                    {professionals.find((p) => p.id === selectedApt.professional_id)?.name || "Profesional"}
                  </p>
                </div>
              </div>

              {/* Registro de Precio Final Cobrado */}
              <div className="space-y-1.5 pt-1">
                <Label className="text-xs">
                  Monto final cobrado en el local (CLP)
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={finalPriceInput}
                    onChange={(e) => setFinalPriceInput(parseInt(e.target.value, 10) || 0)}
                    prefixNode={<DollarSign className="w-4 h-4" />}
                    step={1000}
                    className="text-xs font-bold text-pink-600"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const res = await updateAppointmentStatus(
                        selectedApt.id,
                        selectedApt.status,
                        finalPriceInput
                      );
                      setFeedback(res);
                      if (res.success) setSelectedApt(null);
                    }}
                  >
                    Guardar Precio
                  </Button>
                </div>
              </div>

              {/* Acciones de Cambio de Estado en 1 Clic */}
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
                <p className="font-bold text-[11px] text-neutral-400 uppercase tracking-wider">
                  Acciones Rápidas:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={async () => {
                      const res = await updateAppointmentStatus(
                        selectedApt.id,
                        "completed",
                        finalPriceInput
                      );
                      setFeedback(res);
                      setSelectedApt(null);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Completada
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      const res = await updateAppointmentStatus(
                        selectedApt.id,
                        "no_show"
                      );
                      setFeedback(res);
                      setSelectedApt(null);
                    }}
                    className="text-xs"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    No Asistió
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const reason = prompt("Motivo de cancelación:") || "Cancelada en agenda";
                      const res = await updateAppointmentStatus(
                        selectedApt.id,
                        "cancelled",
                        undefined,
                        reason
                      );
                      setFeedback(res);
                      setSelectedApt(null);
                    }}
                    className="text-xs text-neutral-500 hover:text-red-600"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================
          MODAL: NUEVA CITA MANUAL DESDE RECEPCIÓN
          ======================================================== */}
      {showNewAptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <Card className="w-full max-w-lg bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowNewAptModal(false)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Nueva Cita Manual</CardTitle>
            </CardHeader>

            <CardContent>
              <form
                action={async (formData) => {
                  setIsSubmitting(true);
                  const res = await createManualAppointment(formData);
                  setIsSubmitting(false);
                  setFeedback(res);
                  if (res.success) setShowNewAptModal(false);
                }}
                className="space-y-4 text-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label required>Profesional</Label>
                    <select
                      name="professional_id"
                      defaultValue={isProfessionalOnly && loggedProfessionalId ? loggedProfessionalId : professionals[0]?.id}
                      required
                      className="flex h-10 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs"
                    >
                      {professionals.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label required>Servicio / Variante</Label>
                    <select
                      name="service_variant_id"
                      required
                      className="flex h-10 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs"
                    >
                      {services.flatMap((s) =>
                        (s.service_variants || []).map((v: any) => (
                          <option key={v.id} value={v.id}>
                            {s.name} - {v.name} ({formatCLP(v.price_clp)})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label required>Hora inicio</Label>
                    <Input
                      name="starts_at"
                      type="datetime-local"
                      defaultValue={`${currentDate}T10:00`}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label required>Hora término</Label>
                    <Input
                      name="ends_at"
                      type="datetime-local"
                      defaultValue={`${currentDate}T10:45`}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label required>Nombre del cliente</Label>
                    <Input name="client_name" placeholder="Sofía Martínez" required />
                  </div>
                  <div className="space-y-1">
                    <Label>RUT chileno</Label>
                    <Input name="client_rut" placeholder="18.234.567-9" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Teléfono móvil (+56)</Label>
                    <Input name="client_phone" placeholder="+56 9 8765 4321" />
                  </div>
                  <div className="space-y-1">
                    <Label>Precio pactado (CLP)</Label>
                    <Input name="total_price_clp" type="number" defaultValue={22000} step={1000} />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Notas internas de recepción</Label>
                  <Textarea name="admin_notes" placeholder="Agendado telefónicamente..." rows={2} />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setShowNewAptModal(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" isLoading={isSubmitting}>
                    Crear Cita
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================
          MODAL: BLOQUEAR HORARIO DEL LOCAL O PROFESIONAL
          ======================================================== */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <Card className="w-full max-w-md bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-2xl relative">
            <button
              onClick={() => setShowBlockModal(false)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-amber-600">
                <Ban className="w-5 h-5" /> Bloquear Horario
              </CardTitle>
            </CardHeader>

            <CardContent>
              <form
                action={async (formData) => {
                  setIsSubmitting(true);
                  const res = await createScheduleBlock(formData);
                  setIsSubmitting(false);
                  setFeedback(res);
                  if (res.success) setShowBlockModal(false);
                }}
                className="space-y-4 text-xs"
              >
                <div className="space-y-1">
                  <Label>Profesional (opcional, deja vacío para todo el local)</Label>
                  <select
                    name="professional_id"
                    className="flex h-10 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs"
                  >
                    <option value="">Todo el local / Todos</option>
                    {professionals.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label required>Desde</Label>
                    <Input
                      name="starts_at"
                      type="datetime-local"
                      defaultValue={`${currentDate}T13:00`}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label required>Hasta</Label>
                    <Input
                      name="ends_at"
                      type="datetime-local"
                      defaultValue={`${currentDate}T14:30`}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label required>Motivo del bloqueo</Label>
                  <Input name="reason" placeholder="Ej. Mantención de sillones, Reunión de equipo..." required />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setShowBlockModal(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" isLoading={isSubmitting}>
                    Bloquear Horario
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
