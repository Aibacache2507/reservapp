"use client";

import * as React from "react";
import { formatCLP, formatDisplayPhone } from "@/lib/utils/chile";
import { formatChileanDate, formatChileanTime } from "@/lib/utils/dates";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";
import {
  DEFAULT_WHATSAPP_TEMPLATES,
  DEFAULT_EMAIL_TEMPLATES,
  interpolateVariables,
} from "@/lib/notifications/templates";
import {
  markWhatsAppSent,
  saveMessageTemplate,
  sendTestEmailAction,
  type NotificationActionResult,
} from "./actions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Mail,
  Send,
  CheckCircle2,
  Clock,
  ExternalLink,
  History,
  FileText,
  AlertCircle,
  Eye,
  Smartphone,
  Check,
} from "lucide-react";

interface PendingAppointment {
  id: string;
  business_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  total_price_clp: number;
  access_token: string;
  clients: {
    name: string;
    phone: string;
    email: string;
  };
  professionals: {
    name: string;
  };
  services: {
    name: string;
  };
  suggestedTrigger: "reminder_24h" | "reminder_2h" | "confirmation";
  alreadySentWa?: boolean;
}

interface NotificationsViewProps {
  business: any;
  pendingAppointments: PendingAppointment[];
  templates: any[];
  historyLogs: any[];
}

const TRIGGER_LABELS: Record<string, string> = {
  confirmation: "Confirmación de Cita",
  reminder_24h: "Recordatorio 24 Horas",
  reminder_2h: "Recordatorio 2 Horas",
  cancelled: "Cita Cancelada",
  rescheduled: "Cita Reprogramada",
  waitlist_available: "Aviso Lista de Espera",
  review_request: "Solicitud de Reseña",
};

export function NotificationsView({
  business,
  pendingAppointments: initialPending,
  templates: initialTemplates,
  historyLogs: initialLogs,
}: NotificationsViewProps) {
  const [pendingList, setPendingList] = React.useState(initialPending);
  const [logs, setLogs] = React.useState(initialLogs);
  const [feedback, setFeedback] = React.useState<NotificationActionResult | null>(null);

  // Filtro de lista de WhatsApp (todos / hoy / mañana)
  const [waFilter, setWaFilter] = React.useState<"all" | "today" | "tomorrow">("all");

  // Estado para el editor de plantillas
  const [activeChannel, setActiveChannel] = React.useState<"whatsapp_manual" | "email">("whatsapp_manual");
  const [selectedTrigger, setSelectedTrigger] = React.useState<string>("reminder_24h");
  
  // Buscar plantilla existente o cargar la default
  const getCurrentTemplate = (trigger: string, channel: string) => {
    const custom = initialTemplates.find(
      (t) => t.trigger_event === trigger && t.channel === channel
    );
    if (custom) {
      return {
        subject: custom.subject || "",
        body: custom.body,
      };
    }
    if (channel === "whatsapp_manual") {
      return {
        subject: "",
        body: DEFAULT_WHATSAPP_TEMPLATES[trigger] || "",
      };
    } else {
      return {
        subject: DEFAULT_EMAIL_TEMPLATES[trigger]?.subject || "",
        body: DEFAULT_EMAIL_TEMPLATES[trigger]?.body || "",
      };
    }
  };

  const [currentSubject, setCurrentSubject] = React.useState<string>(
    getCurrentTemplate(selectedTrigger, activeChannel).subject
  );
  const [currentBody, setCurrentBody] = React.useState<string>(
    getCurrentTemplate(selectedTrigger, activeChannel).body
  );

  // Al cambiar trigger o canal, actualizar inputs
  React.useEffect(() => {
    const t = getCurrentTemplate(selectedTrigger, activeChannel);
    setCurrentSubject(t.subject);
    setCurrentBody(t.body);
  }, [selectedTrigger, activeChannel]);

  // Variables de demostración para la vista previa en vivo
  const sampleVariables = {
    nombre: "Camila González",
    servicio: "Manicure Rusa con Esmaltado",
    profesional: "Ignacia Rojas",
    fecha: "Viernes 24 de Octubre",
    hora: "15:30",
    direccion: business.address || "Av. Providencia 2133, Local 12, Santiago",
    enlace_gestion: "https://reservapp.cl/reserva/demo_token",
    negocio: business.name || "Mi Local",
    precio: "$28.000",
  };

  const previewText = interpolateVariables(currentBody, sampleVariables);
  const previewSubject = interpolateVariables(currentSubject, sampleVariables);

  // Insertar variable en textarea
  const insertVariable = (variableKey: string) => {
    setCurrentBody((prev) => prev + ` {${variableKey}}`);
  };

  // Filtrar citas pendientes por fecha
  const filteredPending = pendingList.filter((appt) => {
    if (waFilter === "all") return true;
    const apptDate = new Date(appt.starts_at).toISOString().split("T")[0];
    const todayStr = new Date().toISOString().split("T")[0];
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split("T")[0];

    if (waFilter === "today") return apptDate === todayStr;
    if (waFilter === "tomorrow") return apptDate === tomorrowStr;
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Notificaciones y Recordatorios
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Control de envíos automáticos por correo (Resend), mensajes listos para WhatsApp (wa.me) y edición de plantillas
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            feedback.error
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.error ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.error || feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="underline font-semibold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Pestañas Principales */}
      <Tabs defaultValue="pending_wa" className="space-y-4">
        <TabsList className="grid grid-cols-3 max-w-lg">
          <TabsTrigger value="pending_wa" className="flex items-center gap-1.5 text-xs">
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Por Enviar ({filteredPending.length})</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-1.5 text-xs">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Plantillas</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1.5 text-xs">
            <History className="w-3.5 h-3.5 text-purple-600" />
            <span>Historial ({logs.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* =========================================================================
            PESTAÑA 1: MENSAJES POR ENVIAR POR WHATSAPP (MANUAL WA.ME)
           ========================================================================= */}
        <TabsContent value="pending_wa" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                Mensajes Listos para WhatsApp
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Citas de hoy y mañana que requieren acción. Presiona "Enviar" para abrir WhatsApp con el texto listo.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setWaFilter("all")}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                  waFilter === "all"
                    ? "bg-white dark:bg-neutral-900 shadow-xs text-neutral-900 dark:text-neutral-100"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                Todos ({pendingList.length})
              </button>
              <button
                type="button"
                onClick={() => setWaFilter("today")}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                  waFilter === "today"
                    ? "bg-white dark:bg-neutral-900 shadow-xs text-neutral-900 dark:text-neutral-100"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => setWaFilter("tomorrow")}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                  waFilter === "tomorrow"
                    ? "bg-white dark:bg-neutral-900 shadow-xs text-neutral-900 dark:text-neutral-100"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                Mañana
              </button>
            </div>
          </div>

          {filteredPending.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-semibold">¡Todo al día!</p>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                  No hay recordatorios pendientes ni citas sin notificar en este período.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredPending.map((appt) => {
                const trigger = appt.suggestedTrigger || "reminder_24h";
                const templateText =
                  getCurrentTemplate(trigger, "whatsapp_manual").body ||
                  DEFAULT_WHATSAPP_TEMPLATES[trigger];

                const appUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
                const manageUrl = `${appUrl}/reserva/${appt.access_token}`;

                const waVariables = {
                  nombre: appt.clients?.name || "Cliente",
                  servicio: appt.services?.name || "Servicio",
                  profesional: appt.professionals?.name || "Especialista",
                  fecha: formatChileanDate(appt.starts_at),
                  hora: formatChileanTime(appt.starts_at),
                  direccion: business.address || "Dirección del local",
                  enlace_gestion: manageUrl,
                  negocio: business.name,
                  precio: formatCLP(appt.total_price_clp || 0),
                };

                const messageText = interpolateVariables(templateText, waVariables);
                const waLink = buildWhatsAppLink(appt.clients?.phone || "", messageText);

                return (
                  <Card key={appt.id} className="overflow-hidden border-neutral-200 dark:border-neutral-800">
                    <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      {/* Información de la cita */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                            {appt.clients?.name}
                          </span>
                          <span className="text-xs text-neutral-500 font-mono">
                            {formatDisplayPhone(appt.clients?.phone || "")}
                          </span>
                          <Badge
                            variant={
                              trigger === "reminder_2h"
                                ? "destructive"
                                : trigger === "reminder_24h"
                                ? "warning"
                                : "secondary"
                            }
                            className="text-[10px]"
                          >
                            {TRIGGER_LABELS[trigger]}
                          </Badge>
                        </div>

                        <p className="text-xs text-neutral-600 dark:text-neutral-300">
                          <strong>{appt.services?.name}</strong> con{" "}
                          <span>{appt.professionals?.name}</span>
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-neutral-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-pink-600" />
                            {formatChileanDate(appt.starts_at)} a las {formatChileanTime(appt.starts_at)} hrs
                          </span>
                          <span>•</span>
                          <span>{formatCLP(appt.total_price_clp || 0)}</span>
                        </div>
                      </div>

                      {/* Botones de Acción */}
                      <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-neutral-100 dark:border-neutral-800">
                        {/* Botón Abrir WhatsApp */}
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs"
                          title="Abrir chat en WhatsApp Web o móvil con el mensaje listo"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Enviar WhatsApp</span>
                        </a>

                        {/* Botón Marcar como Enviado */}
                        <form
                          action={async (formData) => {
                            const res = await markWhatsAppSent(formData);
                            setFeedback(res);
                            if (res.success) {
                              setPendingList((prev) => prev.filter((item) => item.id !== appt.id));
                            }
                          }}
                        >
                          <input type="hidden" name="business_id" value={business.id} />
                          <input type="hidden" name="appointment_id" value={appt.id} />
                          <input type="hidden" name="trigger_event" value={trigger} />
                          <input type="hidden" name="recipient" value={appt.clients?.phone || ""} />
                          <input type="hidden" name="body" value={messageText} />

                          <Button
                            type="submit"
                            variant="secondary"
                            size="sm"
                            className="text-xs text-neutral-700 dark:text-neutral-300"
                            title="Registrar que ya se envió el mensaje para no duplicar"
                          >
                            <Check className="w-3.5 h-3.5 mr-1 text-neutral-400" />
                            Marcar Enviado
                          </Button>
                        </form>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* =========================================================================
            PESTAÑA 2: EDITOR DE PLANTILLAS CON VISTA PREVIA EN VIVO
           ========================================================================= */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Columna Izquierda: Formulario de edición (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold">
                        Personalizar Plantillas
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Configura los textos para cada canal y tipo de evento
                      </CardDescription>
                    </div>

                    {/* Selector de Canal */}
                    <div className="flex rounded-lg border border-neutral-200 dark:border-neutral-800 p-0.5 bg-neutral-100 dark:bg-neutral-800 text-xs">
                      <button
                        type="button"
                        onClick={() => setActiveChannel("whatsapp_manual")}
                        className={`px-3 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                          activeChannel === "whatsapp_manual"
                            ? "bg-white dark:bg-neutral-900 text-emerald-600 shadow-xs"
                            : "text-neutral-500 hover:text-neutral-800"
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        WhatsApp
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveChannel("email")}
                        className={`px-3 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                          activeChannel === "email"
                            ? "bg-white dark:bg-neutral-900 text-pink-600 shadow-xs"
                            : "text-neutral-500 hover:text-neutral-800"
                        }`}
                      >
                        <Mail className="w-3.5 h-3.5" />
                        Correo (Resend)
                      </button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Selector de Evento */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tipo de Notificación</Label>
                    <select
                      value={selectedTrigger}
                      onChange={(e) => setSelectedTrigger(e.target.value)}
                      className="flex h-9 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs font-medium"
                    >
                      {Object.entries(TRIGGER_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Formulario de Guardado */}
                  <form
                    action={async (formData) => {
                      const res = await saveMessageTemplate(formData);
                      setFeedback(res);
                    }}
                    className="space-y-4"
                  >
                    <input type="hidden" name="business_id" value={business.id} />
                    <input type="hidden" name="trigger_event" value={selectedTrigger} />
                    <input type="hidden" name="channel" value={activeChannel} />

                    {activeChannel === "email" && (
                      <div className="space-y-1">
                        <Label className="text-xs">Asunto del Correo</Label>
                        <Input
                          name="subject"
                          value={currentSubject}
                          onChange={(e) => setCurrentSubject(e.target.value)}
                          placeholder="Ej. Recordatorio de tu cita..."
                          className="text-xs"
                          required
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Cuerpo del Mensaje</Label>
                        <span className="text-[11px] text-neutral-400">
                          {activeChannel === "whatsapp_manual" ? "Soporta *negrita* y emojis" : "Texto claro y amigable"}
                        </span>
                      </div>
                      <Textarea
                        name="body"
                        value={currentBody}
                        onChange={(e) => setCurrentBody(e.target.value)}
                        rows={7}
                        className="text-xs font-mono"
                        required
                      />
                    </div>

                    {/* Botones de Variables Disponibles */}
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-neutral-500 uppercase tracking-wider">
                        Variables disponibles (haz clic para insertar):
                      </Label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "nombre",
                          "servicio",
                          "profesional",
                          "fecha",
                          "hora",
                          "direccion",
                          "enlace_gestion",
                          "precio",
                          "negocio",
                        ].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => insertVariable(v)}
                            className="px-2 py-0.5 rounded-md bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-mono text-[11px] transition-colors cursor-pointer"
                          >
                            {`{${v}}`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const t = getCurrentTemplate(selectedTrigger, activeChannel);
                          setCurrentSubject(t.subject);
                          setCurrentBody(t.body);
                        }}
                        className="text-xs text-neutral-500"
                      >
                        Restablecer Predeterminado
                      </Button>

                      <Button type="submit" size="sm" className="text-xs">
                        Guardar Plantilla
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Prueba de Envío de Correo */}
              {activeChannel === "email" && (
                <Card className="bg-pink-50/40 border-pink-200 dark:bg-pink-950/20 dark:border-pink-900">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-pink-700 dark:text-pink-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      Enviar Correo de Prueba (Resend)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form
                      action={async (formData) => {
                        const res = await sendTestEmailAction(formData);
                        setFeedback(res);
                      }}
                      className="flex items-center gap-2"
                    >
                      <input type="hidden" name="business_id" value={business.id} />
                      <input type="hidden" name="trigger_event" value={selectedTrigger} />
                      <input type="hidden" name="subject" value={currentSubject} />
                      <input type="hidden" name="body" value={currentBody} />

                      <Input
                        name="recipient_email"
                        type="email"
                        placeholder="tu-correo@ejemplo.com"
                        className="text-xs bg-white dark:bg-neutral-900"
                        required
                      />
                      <Button type="submit" size="sm" className="text-xs shrink-0">
                        Probar Envío
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Columna Derecha: Vista previa en vivo interactiva (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500">
                <Eye className="w-3.5 h-3.5" />
                <span>Vista Previa en Vivo (Datos de Ejemplo)</span>
              </div>

              {activeChannel === "whatsapp_manual" ? (
                /* Simulación de Celular / Pantalla de WhatsApp */
                <div className="rounded-2xl border-4 border-neutral-300 dark:border-neutral-700 bg-[#efeae2] dark:bg-[#0b141a] overflow-hidden shadow-md">
                  {/* Barra superior de WhatsApp */}
                  <div className="bg-[#075e54] dark:bg-[#202c33] text-white p-3 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold">
                      {business.name?.slice(0, 1) || "L"}
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight">{business.name}</p>
                      <p className="text-[10px] text-emerald-200">En línea</p>
                    </div>
                  </div>

                  {/* Área de Mensajes */}
                  <div className="p-4 space-y-2 min-h-[300px]">
                    <div className="bg-[#dcf8c6] dark:bg-[#005c4b] text-neutral-900 dark:text-neutral-100 p-3 rounded-xl rounded-tr-none shadow-xs text-xs whitespace-pre-wrap leading-relaxed max-w-[90%] ml-auto">
                      {previewText || "Escribe el texto de la plantilla en el panel izquierdo..."}
                      <div className="text-[10px] text-neutral-400 text-right mt-1">
                        15:30 ✓✓
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Simulación de Correo HTML */
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
                  {/* Encabezado del correo */}
                  <div
                    className="p-5 text-center text-white"
                    style={{ backgroundColor: business.brand_color || "#ec4899" }}
                  >
                    <h3 className="font-extrabold text-base tracking-tight">
                      {business.name}
                    </h3>
                    <p className="text-[11px] opacity-90 mt-0.5">
                      Sistema de Agendamiento Online
                    </p>
                  </div>

                  {/* Cuerpo del correo simulado */}
                  <div className="p-4 space-y-3 text-xs leading-relaxed">
                    <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                      {previewSubject || "Asunto del correo"}
                    </h4>

                    <p className="whitespace-pre-wrap text-neutral-600 dark:text-neutral-300">
                      {previewText}
                    </p>

                    {/* Ficha resumen dentro del correo */}
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border-l-4 border-pink-500 space-y-1 text-[11px]">
                      <p>
                        <strong>Servicio:</strong> {sampleVariables.servicio}
                      </p>
                      <p>
                        <strong>Profesional:</strong> {sampleVariables.profesional}
                      </p>
                      <p>
                        <strong>Fecha y Hora:</strong> {sampleVariables.fecha} a las {sampleVariables.hora} hrs
                      </p>
                      <p>
                        <strong>Total en el local:</strong>{" "}
                        <span className="font-bold text-pink-600">{sampleVariables.precio}</span>
                      </p>
                    </div>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        className="px-4 py-2 rounded-lg text-white font-bold text-xs"
                        style={{ backgroundColor: business.brand_color || "#ec4899" }}
                      >
                        Ver o Gestionar mi Cita
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* =========================================================================
            PESTAÑA 3: HISTORIAL DE NOTIFICACIONES
           ========================================================================= */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <History className="w-4 h-4 text-purple-600" />
                Historial de Notificaciones Enviadas
              </CardTitle>
              <CardDescription className="text-xs">
                Registro de auditoría de todos los correos automáticos por Resend y mensajes manuales por WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="py-8 text-center text-xs text-neutral-400">
                  No hay registros de notificaciones aún.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 text-[11px] uppercase">
                        <th className="py-2.5 px-3">Fecha y Hora</th>
                        <th className="py-2.5 px-3">Canal</th>
                        <th className="py-2.5 px-3">Destinatario</th>
                        <th className="py-2.5 px-3">Asunto / Detalle</th>
                        <th className="py-2.5 px-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40">
                          <td className="py-2.5 px-3 whitespace-nowrap text-neutral-500 font-mono text-[11px]">
                            {log.sent_at || log.created_at
                              ? new Date(log.sent_at || log.created_at).toLocaleString("es-CL", {
                                  timeZone: "America/Santiago",
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })
                              : "-"}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {log.channel === "email" ? (
                              <span className="inline-flex items-center gap-1 text-pink-600 font-medium">
                                <Mail className="w-3 h-3" />
                                Correo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                                <Smartphone className="w-3 h-3" />
                                WhatsApp
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px]">
                            {log.recipient}
                          </td>
                          <td className="py-2.5 px-3 max-w-[280px] truncate text-neutral-700 dark:text-neutral-300">
                            {log.subject || log.body?.slice(0, 40) + "..."}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <Badge
                              variant={
                                log.status === "sent"
                                  ? "success"
                                  : log.status === "failed"
                                  ? "destructive"
                                  : "warning"
                              }
                              className="text-[10px]"
                            >
                              {log.status === "sent"
                                ? "Enviado"
                                : log.status === "failed"
                                ? "Error"
                                : "Pendiente"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
