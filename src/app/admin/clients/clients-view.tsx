"use client";

import * as React from "react";
import { formatCLP } from "@/lib/utils/chile";
import { formatChileanDate, formatChileanTime } from "@/lib/utils/dates";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";
import { saveClientRecord, updateClientContact, type ClientActionResult } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  User,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  Heart,
  Clock,
  Calendar,
  MessageCircle,
  CheckCircle2,
  Edit,
  Save,
} from "lucide-react";

interface ClientsViewProps {
  business: any;
  clients: any[];
  clientRecords: any[];
  appointments: any[];
}

export function ClientsView({
  business,
  clients: initialClients,
  clientRecords: initialRecords,
  appointments,
}: ClientsViewProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedClient, setSelectedClient] = React.useState<any | null>(
    initialClients[0] || null
  );

  const [feedback, setFeedback] = React.useState<ClientActionResult | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  // Filtrado en vivo por Nombre, RUT o Teléfono
  const filteredClients = initialClients.filter((c) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      c.full_name?.toLowerCase().includes(term) ||
      c.rut?.toLowerCase().includes(term) ||
      c.phone?.includes(term) ||
      c.email?.toLowerCase().includes(term)
    );
  });

  // Ficha técnica del cliente seleccionado
  const currentRecord = selectedClient
    ? initialRecords.find((r) => r.client_id === selectedClient.id)
    : null;

  // Citas históricas del cliente seleccionado
  const clientAppointments = selectedClient
    ? appointments.filter((a) => a.client_id === selectedClient.id)
    : [];

  const whatsappUrl = selectedClient?.phone
    ? buildWhatsAppLink(
        selectedClient.phone,
        "Hola {nombre}, te contactamos de {negocio}. ¿Cómo estás?",
        {
          nombre: selectedClient.full_name,
          negocio: business.name,
        }
      )
    : "";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Clientes y Fichas Técnicas
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Historial de visitas, notas privadas, preferencias y fórmulas personalizadas de cada cliente
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
          <span>{feedback.error || feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="underline">
            Cerrar
          </button>
        </div>
      )}

      {/* Grid 2 Columnas: Lista de Clientes (Izq) y Ficha Detallada (Der) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Buscador y Lista de Clientes */}
        <div className="lg:col-span-4 space-y-3">
          <div className="relative">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por Nombre, RUT o Teléfono..."
              prefixNode={<Search className="w-4 h-4" />}
              className="text-xs"
            />
          </div>

          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {filteredClients.length === 0 ? (
              <p className="p-4 text-center text-xs text-neutral-400">
                No se encontraron clientes.
              </p>
            ) : (
              filteredClients.map((c) => {
                const isSelected = selectedClient?.id === c.id;
                const visitCount = appointments.filter((a) => a.client_id === c.id).length;

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedClient(c)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-pink-600 bg-pink-50/50 dark:bg-pink-950/20 shadow-sm"
                        : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                        {c.full_name}
                      </p>
                      <Badge variant="secondary" className="text-[10px]">
                        {visitCount} {visitCount === 1 ? "cita" : "citas"}
                      </Badge>
                    </div>

                    <p className="text-xs text-neutral-500 font-mono mt-0.5">
                      RUT: {c.rut || "Sin RUT"}
                    </p>

                    <p className="text-xs text-neutral-400 mt-1 truncate">
                      {c.phone || "Sin teléfono"} • {c.email || ""}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Columna Derecha: Detalle, Ficha Técnica e Historial */}
        <div className="lg:col-span-8 space-y-6">
          {selectedClient ? (
            <>
              {/* Tarjeta de Información del Cliente y Acceso WhatsApp */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-600 font-bold text-base flex items-center justify-center">
                        {selectedClient.full_name.charAt(0)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {selectedClient.full_name}
                        </CardTitle>
                        <p className="text-xs text-neutral-500 font-mono">
                          RUT: {selectedClient.rut}
                        </p>
                      </div>
                    </div>

                    {whatsappUrl && (
                      <Button
                        variant="whatsapp"
                        size="sm"
                        onClick={() => window.open(whatsappUrl, "_blank")}
                        className="text-xs flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Chat WhatsApp
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-0">
                  <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                    <Phone className="w-4 h-4 text-neutral-400" />
                    <span>{selectedClient.phone || "No registrado"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                    <Mail className="w-4 h-4 text-neutral-400" />
                    <span className="truncate">{selectedClient.email || "No registrado"}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Ficha Técnica Confidencial */}
              <Card className="border-pink-200 dark:border-pink-900 bg-pink-50/20 dark:bg-pink-950/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-pink-700 dark:text-pink-300">
                    <FileText className="w-4 h-4" />
                    Ficha Técnica Privada del Cliente
                  </CardTitle>
                  <CardDescription>
                    Información interna visible solo para el equipo del local (fórmulas, alergias y preferencias)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    action={async (formData) => {
                      setIsSaving(true);
                      formData.append("client_id", selectedClient.id);
                      const res = await saveClientRecord(formData);
                      setIsSaving(false);
                      setFeedback(res);
                    }}
                    className="space-y-4 text-xs"
                  >
                    <div className="space-y-1">
                      <Label className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Alergias o Contraindicaciones
                      </Label>
                      <Input
                        name="allergies"
                        defaultValue={currentRecord?.allergies || ""}
                        placeholder="Ej. Sensibilidad al amoníaco, alergia a látex..."
                        className="text-xs bg-white dark:bg-neutral-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="flex items-center gap-1.5 text-xs font-semibold">
                        <Heart className="w-3.5 h-3.5 text-pink-500" />
                        Preferencias de Atención
                      </Label>
                      <Input
                        name="preferences"
                        defaultValue={currentRecord?.preferences || ""}
                        placeholder="Ej. Prefiere agua sin gas, no usar secador al máximo calor..."
                        className="text-xs bg-white dark:bg-neutral-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">
                        Notas Técnicas del Servicio (Fórmulas de color, decoloración, corte)
                      </Label>
                      <Textarea
                        name="notes"
                        defaultValue={currentRecord?.notes || ""}
                        placeholder="Ej. Tinte 8.1 con oxidante de 20 volúmenes, tiempo de pose 35 min..."
                        rows={3}
                        className="text-xs bg-white dark:bg-neutral-900"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <Button type="submit" size="sm" isLoading={isSaving} className="text-xs">
                        <Save className="w-3.5 h-3.5 mr-1.5" />
                        Guardar Ficha Técnica
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Historial de Citas del Cliente */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-pink-600" />
                    Historial de Citas ({clientAppointments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {clientAppointments.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic py-4 text-center">
                      No hay citas previas registradas para este cliente.
                    </p>
                  ) : (
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      {clientAppointments.map((apt) => (
                        <div
                          key={apt.id}
                          className="py-3 flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5">
                            <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                              {apt.service_variants?.name || "Servicio"}
                            </p>
                            <p className="text-neutral-400 text-[11px]">
                              {formatChileanDate(apt.starts_at)} a las{" "}
                              {formatChileanTime(apt.starts_at)}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-bold text-pink-600">
                              {formatCLP(apt.total_price_clp)}
                            </span>
                            <Badge
                              variant={
                                apt.status === "completed"
                                  ? "success"
                                  : apt.status === "cancelled"
                                  ? "secondary"
                                  : apt.status === "no_show"
                                  ? "destructive"
                                  : "default"
                              }
                              className="text-[10px] capitalize"
                            >
                              {apt.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="p-12 text-center text-sm text-neutral-400 border-dashed">
              <User className="w-8 h-8 mx-auto text-neutral-300 mb-2" />
              <p>Selecciona un cliente de la lista para ver su información y ficha técnica.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
