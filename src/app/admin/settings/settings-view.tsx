"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { formatCLP } from "@/lib/utils/chile";
import {
  updateBusinessGeneral,
  updateBookingRules,
  createCategory,
  deleteCategory,
  createServiceWithVariant,
  addServiceVariant,
  deleteService,
  createProfessional,
  toggleProfessionalService,
  createTimeOff,
  type ActionResult,
} from "./actions";
import {
  Building2,
  Calendar,
  Scissors,
  Users,
  Clock,
  MessageSquare,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Phone,
  MapPin,
  Palette,
  DollarSign,
  Send,
} from "lucide-react";

interface SettingsViewProps {
  business: any;
  branches: any[];
  categories: any[];
  services: any[];
  professionals: any[];
  professionalServices: any[];
  workingHours: any[];
  timeOffList: any[];
  messageTemplates: any[];
}

export function SettingsView({
  business,
  branches,
  categories,
  services,
  professionals,
  professionalServices,
  workingHours,
  timeOffList,
  messageTemplates,
}: SettingsViewProps) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "general";

  const [activeTab, setActiveTab] = React.useState(initialTab);
  const [feedback, setFeedback] = React.useState<ActionResult | null>(null);

  // Estados para formularios de creación modal/inline
  const [showCategoryForm, setShowCategoryForm] = React.useState(false);
  const [showServiceForm, setShowServiceForm] = React.useState(false);
  const [showProfessionalForm, setShowProfessionalForm] = React.useState(false);
  const [showTimeOffForm, setShowTimeOffForm] = React.useState(false);

  const rules = business.booking_rules || {};

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Configuración del Negocio
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Administra tus servicios, equipo, horarios y reglas de reserva en tiempo real
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/${business.slug}`, "_blank")}
            className="flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Ver mi página pública</span>
          </Button>
        </div>
      </div>

      {/* Alerta de Notificación / Feedback */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border text-sm ${
            feedback.error
              ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300"
              : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.error ? (
              <AlertCircle className="w-5 h-5 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            )}
            <span>{feedback.error || feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold underline ml-4 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Pestañas de Configuración */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex justify-start gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl overflow-x-auto">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span>Negocio y Contacto</span>
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Reglas de Reserva</span>
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Scissors className="w-4 h-4" />
            <span>Servicios y Precios ({services.length})</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>Equipo y Estilistas ({professionals.length})</span>
          </TabsTrigger>
          <TabsTrigger value="schedules" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Horarios y Vacaciones</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span>Plantillas de Mensajes</span>
          </TabsTrigger>
        </TabsList>

        {/* ========================================================
            PESTAÑA 1: GENERAL & CONTACTO
            ======================================================== */}
        <TabsContent value="general">
          <form
            action={async (formData) => {
              const res = await updateBusinessGeneral(null, formData);
              setFeedback(res);
            }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información de tu Local</CardTitle>
                <CardDescription>
                  Datos visibles para tus clientes en la página web pública
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" required>
                      Nombre comercial
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={business.name}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug" required>
                      Slug / Enlace público
                    </Label>
                    <Input
                      id="slug"
                      name="slug"
                      defaultValue={business.slug}
                      required
                    />
                    <p className="text-xs text-neutral-500">
                      URL: reservapp.cl/{business.slug}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" required>
                      Teléfono local (+56)
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      defaultValue={business.phone}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp_number" required>
                      WhatsApp del local
                    </Label>
                    <Input
                      id="whatsapp_number"
                      name="whatsapp_number"
                      defaultValue={business.whatsapp_number}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand_color">Color de marca</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        id="brand_color"
                        name="brand_color"
                        defaultValue={business.brand_color || "#ec4899"}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-neutral-300 dark:border-neutral-700 p-0"
                      />
                      <span className="text-xs text-neutral-500 font-mono">
                        {business.brand_color || "#ec4899"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="address" required>
                      Dirección
                    </Label>
                    <Input
                      id="address"
                      name="address"
                      defaultValue={business.address}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Ciudad / Comuna</Label>
                    <Input
                      id="city"
                      name="city"
                      defaultValue={business.city || "Santiago"}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <Button type="submit">Guardar cambios generales</Button>
              </CardFooter>
            </Card>

            {/* Listado de Sucursales */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sucursales del Negocio</CardTitle>
                <CardDescription>
                  Sucursales físicas donde se atienden citas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {branches.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{b.name}</p>
                          {b.is_main && (
                            <Badge variant="default" className="text-[10px]">
                              Casa Matriz
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {b.address}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Activa
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* ========================================================
            PESTAÑA 2: REGLAS DE RESERVA
            ======================================================== */}
        <TabsContent value="rules">
          <form
            action={async (formData) => {
              const res = await updateBookingRules(null, formData);
              setFeedback(res);
            }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Políticas y Reglas de Agendamiento</CardTitle>
                <CardDescription>
                  Define con cuánta anticipación pueden agendar, cancelar o reprogramar tus clientes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="min_advance_hours" required>
                      Anticipación mínima para reservar (horas)
                    </Label>
                    <Input
                      id="min_advance_hours"
                      name="min_advance_hours"
                      type="number"
                      min={0}
                      max={72}
                      defaultValue={rules.min_advance_hours ?? 2}
                      required
                    />
                    <p className="text-xs text-neutral-500">
                      Ej: 2 horas significa que un cliente no puede agendar una cita antes de 2 horas desde el momento actual.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_advance_days" required>
                      Anticipación máxima para reservar (días hacia el futuro)
                    </Label>
                    <Input
                      id="max_advance_days"
                      name="max_advance_days"
                      type="number"
                      min={1}
                      max={365}
                      defaultValue={rules.max_advance_days ?? 60}
                      required
                    />
                    <p className="text-xs text-neutral-500">
                      Ej: 60 días permite agendar hasta con 2 meses de adelanto.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cancellation_limit_hours" required>
                      Plazo límite para cancelar o reprogramar (horas de aviso)
                    </Label>
                    <Input
                      id="cancellation_limit_hours"
                      name="cancellation_limit_hours"
                      type="number"
                      min={0}
                      max={72}
                      defaultValue={rules.cancellation_limit_hours ?? 24}
                      required
                    />
                    <p className="text-xs text-neutral-500">
                      Pasado este plazo, el cliente debe contactar al local directamente.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_reschedules" required>
                      Máximo de reprogramaciones permitidas por cita
                    </Label>
                    <Input
                      id="max_reschedules"
                      name="max_reschedules"
                      type="number"
                      min={0}
                      max={10}
                      defaultValue={rules.max_reschedules ?? 2}
                      required
                    />
                    <p className="text-xs text-neutral-500">
                      Límite de veces que un cliente puede cambiar su hora por cuenta propia.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slot_interval_minutes" required>
                      Intervalo entre horarios disponibles (minutos)
                    </Label>
                    <select
                      id="slot_interval_minutes"
                      name="slot_interval_minutes"
                      defaultValue={rules.slot_interval_minutes ?? 15}
                      className="flex h-10 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                    >
                      <option value="15">Cada 15 minutos (ej. 10:00, 10:15, 10:30)</option>
                      <option value="30">Cada 30 minutos (ej. 10:00, 10:30, 11:00)</option>
                      <option value="60">Cada 60 minutos (ej. 10:00, 11:00)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Label htmlFor="no_show_policy">
                    Política de Inasistencia (No-Show)
                  </Label>
                  <Textarea
                    id="no_show_policy"
                    name="no_show_policy"
                    defaultValue={
                      rules.no_show_policy ||
                      "Si no asistes o cancelas con menos de 24 horas de anticipación, tu próxima reserva requerirá confirmación previa."
                    }
                    placeholder="Explica a tus clientes qué ocurre en caso de no presentarse..."
                    rows={3}
                  />
                  <p className="text-xs text-neutral-500">
                    Este texto se mostrará en la confirmación de cita y el correo enviado al cliente.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <Button type="submit">Guardar reglas de agendamiento</Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        {/* ========================================================
            PESTAÑA 3: SERVICIOS Y PRECIOS
            ======================================================== */}
        <TabsContent value="services" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Catálogo de Servicios</h3>
              <p className="text-sm text-neutral-500">
                Organiza tus servicios por categorías y define precios en CLP con sus duraciones
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCategoryForm(!showCategoryForm)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Nueva Categoría
              </Button>
              <Button
                size="sm"
                onClick={() => setShowServiceForm(!showServiceForm)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Nuevo Servicio
              </Button>
            </div>
          </div>

          {/* Formulario para agregar Categoría */}
          {showCategoryForm && (
            <Card className="border-pink-200 dark:border-pink-900 bg-pink-50/50 dark:bg-pink-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Crear Nueva Categoría</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  action={async (formData) => {
                    const res = await createCategory(formData);
                    setFeedback(res);
                    if (res.success) setShowCategoryForm(false);
                  }}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <Input
                    name="name"
                    placeholder="Ej. Cortes, Coloración, Manicure..."
                    required
                  />
                  <Input
                    name="description"
                    placeholder="Descripción opcional"
                  />
                  <Button type="submit">Guardar</Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowCategoryForm(false)}
                  >
                    Cancelar
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Formulario para agregar Servicio */}
          {showServiceForm && (
            <Card className="border-pink-200 dark:border-pink-900 bg-pink-50/50 dark:bg-pink-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Agregar Servicio y Variante Inicial</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  action={async (formData) => {
                    const res = await createServiceWithVariant(formData);
                    setFeedback(res);
                    if (res.success) setShowServiceForm(false);
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label required>Categoría</Label>
                      <select
                        name="category_id"
                        required
                        className="flex h-10 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label required>Nombre del servicio</Label>
                      <Input
                        name="name"
                        placeholder="Ej. Balayage Iluminación"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label required>Nombre de la variante</Label>
                      <Input
                        name="variant_name"
                        defaultValue="Estándar"
                        placeholder="Ej. Cabello Medio"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label required>Duración (minutos)</Label>
                      <Input
                        name="duration_minutes"
                        type="number"
                        defaultValue={45}
                        min={10}
                        step={5}
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label required>Precio en CLP</Label>
                      <Input
                        name="price_clp"
                        type="number"
                        defaultValue={25000}
                        step={1000}
                        prefixNode={<DollarSign className="w-4 h-4" />}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowServiceForm(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">Crear Servicio</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Listado de Servicios agrupados por Categoría */}
          <div className="space-y-6">
            {categories.map((cat) => {
              const catServices = services.filter((s) => s.category_id === cat.id);
              return (
                <Card key={cat.id}>
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div>
                      <CardTitle className="text-base font-bold text-pink-600">
                        {cat.name}
                      </CardTitle>
                      {cat.description && (
                        <CardDescription>{cat.description}</CardDescription>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (confirm(`¿Eliminar la categoría "${cat.name}"?`)) {
                          const res = await deleteCategory(cat.id);
                          setFeedback(res);
                        }
                      }}
                      className="text-neutral-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {catServices.length === 0 ? (
                      <p className="text-xs text-neutral-400 italic">
                        No hay servicios en esta categoría aún.
                      </p>
                    ) : (
                      catServices.map((srv) => (
                        <div
                          key={srv.id}
                          className="p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/30 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm">
                              {srv.name}
                            </span>
                            <button
                              onClick={async () => {
                                if (confirm(`¿Eliminar el servicio "${srv.name}"?`)) {
                                  const res = await deleteService(srv.id);
                                  setFeedback(res);
                                }
                              }}
                              className="text-neutral-400 hover:text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Variantes del servicio */}
                          <div className="pl-3 border-l-2 border-pink-200 dark:border-pink-900 space-y-1.5">
                            {srv.service_variants?.map((v: any) => (
                              <div
                                key={v.id}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="text-neutral-700 dark:text-neutral-300">
                                  {v.name} ({v.duration_minutes} min)
                                </span>
                                <span className="font-bold text-pink-600">
                                  {formatCLP(v.price_clp)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ========================================================
            PESTAÑA 4: EQUIPO Y PROFESIONALES
            ======================================================== */}
        <TabsContent value="team" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Equipo de Trabajo</h3>
              <p className="text-sm text-neutral-500">
                Registra a tus estilistas, barberos y profesionales, asígnale sus servicios y comisiones
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setShowProfessionalForm(!showProfessionalForm)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Nuevo Profesional
            </Button>
          </div>

          {showProfessionalForm && (
            <Card className="border-pink-200 dark:border-pink-900 bg-pink-50/50 dark:bg-pink-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Agregar Profesional / Estilista</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  action={async (formData) => {
                    const res = await createProfessional(formData);
                    setFeedback(res);
                    if (res.success) setShowProfessionalForm(false);
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label required>Nombre completo</Label>
                      <Input
                        name="name"
                        placeholder="Ej. Valentina Rojas"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Correo electrónico</Label>
                      <Input
                        name="email"
                        type="email"
                        placeholder="valentina@tunegocio.cl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label>Teléfono móvil (+56)</Label>
                      <Input
                        name="phone"
                        placeholder="+56 9 8888 7777"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>Comisión (%)</Label>
                      <Input
                        name="commission_percentage"
                        type="number"
                        defaultValue={40}
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>Especialidades (separadas por coma)</Label>
                      <Input
                        name="specialties"
                        placeholder="Balayage, Corte, Peinado"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowProfessionalForm(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">Guardar Profesional</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Listado de Profesionales con asignación de servicios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {professionals.map((prof) => {
              const assignedVariantIds = new Set(
                professionalServices
                  .filter((ps) => ps.professional_id === prof.id && ps.is_active)
                  .map((ps) => ps.service_variant_id)
              );

              return (
                <Card key={prof.id} className="flex flex-col justify-between">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{prof.name}</CardTitle>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {prof.email || "Sin correo"} • {prof.phone || "Sin teléfono"}
                        </p>
                      </div>
                      <Badge variant="default" className="text-xs">
                        {prof.commission_percentage}% Comisión
                      </Badge>
                    </div>

                    {prof.specialties && prof.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {prof.specialties.map((s: string, idx: number) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-[10px]"
                          >
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-3 pt-0">
                    <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3">
                      <p className="text-xs font-semibold mb-2 text-neutral-600 dark:text-neutral-400">
                        Servicios que realiza:
                      </p>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {services.map((srv) => (
                          <div key={srv.id} className="space-y-1">
                            <span className="text-[11px] font-bold text-neutral-500 uppercase">
                              {srv.name}
                            </span>
                            {srv.service_variants?.map((v: any) => {
                              const isAssigned = assignedVariantIds.has(v.id);
                              return (
                                <label
                                  key={v.id}
                                  className="flex items-center justify-between text-xs p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={isAssigned}
                                      onChange={async (e) => {
                                        await toggleProfessionalService(
                                          prof.id,
                                          v.id,
                                          e.target.checked
                                        );
                                      }}
                                      className="rounded text-pink-600 focus:ring-pink-500"
                                    />
                                    <span>{v.name}</span>
                                  </div>
                                  <span className="text-neutral-400 text-[11px]">
                                    {v.duration_minutes}m • {formatCLP(v.price_clp)}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ========================================================
            PESTAÑA 5: HORARIOS Y VACACIONES
            ======================================================== */}
        <TabsContent value="schedules" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Horarios Semanales y Días Libres</h3>
              <p className="text-sm text-neutral-500">
                Jornada de atención por profesional, descansos de almuerzo y bloqueos por vacaciones
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowTimeOffForm(!showTimeOffForm)}
            >
              <Calendar className="w-4 h-4 mr-1" />
              Registrar Vacaciones / Feriado
            </Button>
          </div>

          {/* Formulario de Vacaciones / Time Off */}
          {showTimeOffForm && (
            <Card className="border-pink-200 dark:border-pink-900 bg-pink-50/50 dark:bg-pink-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Registrar Período Libre / Vacaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  action={async (formData) => {
                    const res = await createTimeOff(formData);
                    setFeedback(res);
                    if (res.success) setShowTimeOffForm(false);
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label required>Profesional</Label>
                      <select
                        name="professional_id"
                        required
                        className="flex h-10 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
                      >
                        {professionals.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label required>Fecha inicio</Label>
                      <Input name="start_date" type="date" required />
                    </div>

                    <div className="space-y-1">
                      <Label>Fecha término</Label>
                      <Input name="end_date" type="date" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label>Motivo</Label>
                    <Input
                      name="reason"
                      placeholder="Ej. Vacaciones de verano, Feriado personal, Licencia..."
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowTimeOffForm(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">Bloquear Fechas</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Días libres registrados */}
          {timeOffList.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Vacaciones y Días Libres Programados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {timeOffList.map((to) => {
                    const prof = professionals.find((p) => p.id === to.professional_id);
                    return (
                      <div
                        key={to.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/40 text-xs"
                      >
                        <div>
                          <span className="font-bold text-neutral-800 dark:text-neutral-200">
                            {prof?.name || "Profesional"}
                          </span>
                          <span className="text-neutral-500 ml-2">
                            ({to.start_date} al {to.end_date})
                          </span>
                          <p className="text-neutral-400 mt-0.5">{to.reason}</p>
                        </div>
                        <Badge variant="warning">Libre</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Horario de la semana general */}
          <div className="space-y-4">
            {professionals.map((prof) => {
              const profHours = workingHours.filter((wh) => wh.professional_id === prof.id);
              const daysOfWeek = [
                { id: 1, name: "Lunes" },
                { id: 2, name: "Martes" },
                { id: 3, name: "Miércoles" },
                { id: 4, name: "Jueves" },
                { id: 5, name: "Viernes" },
                { id: 6, name: "Sábado" },
                { id: 0, name: "Domingo" },
              ];

              return (
                <Card key={prof.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold flex items-center justify-between">
                      <span>{prof.name}</span>
                      <span className="text-xs text-neutral-500 font-normal">
                        Horario habitual semanal
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                      {daysOfWeek.map((day) => {
                        const wh = profHours.find((h) => h.day_of_week === day.id);
                        const isWorking = wh ? wh.is_active : false;

                        return (
                          <div
                            key={day.id}
                            className={`p-2.5 rounded-lg border text-center text-xs space-y-1 ${
                              isWorking
                                ? "border-pink-200 bg-pink-50/30 dark:border-pink-900 dark:bg-pink-950/20"
                                : "border-neutral-200 bg-neutral-100/50 dark:border-neutral-800 dark:bg-neutral-900/30 opacity-60"
                            }`}
                          >
                            <p className="font-semibold text-neutral-700 dark:text-neutral-300">
                              {day.name}
                            </p>
                            {isWorking ? (
                              <p className="text-[11px] text-pink-700 dark:text-pink-300 font-mono">
                                {wh?.start_time?.slice(0, 5)} - {wh?.end_time?.slice(0, 5)}
                              </p>
                            ) : (
                              <p className="text-[11px] text-neutral-400">Descanso</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ========================================================
            PESTAÑA 6: PLANTILLAS DE MENSAJES (WHATSAPP & EMAIL)
            ======================================================== */}
        <TabsContent value="messages" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Plantillas de Mensajes</h3>
            <p className="text-sm text-neutral-500">
              Personaliza el texto de los correos automáticos y de los enlaces WhatsApp (wa.me)
            </p>
          </div>

          <div className="space-y-4">
            {messageTemplates.map((tpl) => (
              <Card key={tpl.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold">
                        Evento: {tpl.trigger_event}
                      </CardTitle>
                      <CardDescription>
                        Canal: {tpl.channel === "whatsapp_manual" ? "WhatsApp (wa.me)" : "Correo Electrónico"}
                      </CardDescription>
                    </div>
                    <Badge variant={tpl.channel === "whatsapp_manual" ? "success" : "default"}>
                      {tpl.channel === "whatsapp_manual" ? "WhatsApp Manual" : "Email Resend"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tpl.subject && (
                    <div className="space-y-1">
                      <Label className="text-xs">Asunto del correo</Label>
                      <Input defaultValue={tpl.subject} readOnly className="text-xs bg-neutral-50" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label className="text-xs">Cuerpo del mensaje</Label>
                    <Textarea
                      defaultValue={tpl.body}
                      rows={4}
                      className="text-xs font-mono"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[11px] text-neutral-400 mr-1">Variables:</span>
                    {["{nombre}", "{servicio}", "{profesional}", "{fecha}", "{hora}", "{direccion}", "{enlace_gestion}"].map(
                      (v) => (
                        <span
                          key={v}
                          className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[10px] font-mono text-pink-600"
                        >
                          {v}
                        </span>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
