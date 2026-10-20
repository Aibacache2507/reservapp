"use client";

import * as React from "react";
import { formatCLP, formatRut, validateRut } from "@/lib/utils/chile";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";
import { downloadICSFile } from "@/lib/utils/calendar";
import { formatChileanDate, formatChileanTime } from "@/lib/utils/dates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { WaitlistModal } from "./waitlist-modal";
import {
  fetchAvailableSlots,
  applyCouponCode,
  createAppointmentBooking,
  type BookingResult,
} from "./actions";
import {
  Scissors,
  Users,
  Calendar as CalendarIcon,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Tag,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  MapPin,
  MessageCircle,
  Download,
  Copy,
  Check,
} from "lucide-react";
import type { AvailableSlot } from "@/types/database";

interface BookingWizardProps {
  business: any;
  categories: any[];
  services: any[];
  professionals: any[];
  professionalServices: any[];
  branches: any[];
}

export function BookingWizard({
  business,
  categories,
  services,
  professionals,
  professionalServices,
  branches,
}: BookingWizardProps) {
  // Pasos: 1: Servicio -> 2: Profesional -> 3: Fecha & Hora -> 4: Datos -> 5: Éxito
  const [currentStep, setCurrentStep] = React.useState<1 | 2 | 3 | 4 | 5>(1);

  // Selecciones
  const [selectedVariant, setSelectedVariant] = React.useState<any | null>(null);
  const [selectedProfessional, setSelectedProfessional] = React.useState<any | null>(null); // null = "cualquiera disponible"
  const [selectedDate, setSelectedDate] = React.useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedSlot, setSelectedSlot] = React.useState<AvailableSlot | null>(null);

  // Cupones
  const [couponCode, setCouponCode] = React.useState("");
  const [couponFeedback, setCouponFeedback] = React.useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = React.useState(0);

  // Slots libres
  const [slots, setSlots] = React.useState<AvailableSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = React.useState(false);
  const [showWaitlist, setShowWaitlist] = React.useState(false);

  // Formulario cliente
  const [clientRut, setClientRut] = React.useState("");
  const [rutError, setRutError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [bookingError, setBookingError] = React.useState<string | null>(null);
  const [bookingSuccessData, setBookingSuccessData] = React.useState<any | null>(null);
  const [copiedLink, setCopiedLink] = React.useState(false);

  // Reglas del negocio
  const rules = business.booking_rules || {};
  const mainBranch = branches.find((b) => b.is_main) || branches[0];

  // Calcular precio final
  const basePrice = selectedVariant?.price_clp || 0;
  const finalPrice = Math.max(0, basePrice - discountAmount);

  // Cargar slots cuando cambie fecha, servicio o profesional
  React.useEffect(() => {
    if (currentStep === 3 && selectedVariant && selectedDate) {
      let isMounted = true;
      setIsLoadingSlots(true);
      fetchAvailableSlots(
        business.id,
        selectedVariant.id,
        selectedProfessional?.id || null,
        selectedDate
      )
        .then((data) => {
          if (isMounted) {
            setSlots(data);
            setSelectedSlot(null);
          }
        })
        .finally(() => {
          if (isMounted) setIsLoadingSlots(false);
        });
      return () => {
        isMounted = false;
      };
    }
  }, [currentStep, selectedVariant, selectedProfessional, selectedDate, business.id]);

  // Manejo de cupón
  const handleApplyCoupon = async () => {
    if (!selectedVariant || !couponCode.trim()) return;
    const res = await applyCouponCode(business.id, couponCode, selectedVariant.price_clp);
    setCouponFeedback(res.message);
    if (res.valid) {
      setDiscountAmount(res.discount_amount_clp);
    } else {
      setDiscountAmount(0);
    }
  };

  // Validación de RUT al escribir
  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatRut(raw);
    setClientRut(formatted);
    if (formatted.length >= 8) {
      if (!validateRut(formatted)) {
        setRutError("Dígito verificador de RUT no válido");
      } else {
        setRutError(null);
      }
    } else {
      setRutError(null);
    }
  };

  // Enviar reserva definitiva
  const handleConfirmBooking = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedVariant || !selectedSlot) return;

    if (!validateRut(clientRut)) {
      setRutError("Por favor ingresa un RUT chileno válido antes de confirmar.");
      return;
    }

    setIsSubmitting(true);
    setBookingError(null);

    const formData = new FormData(e.currentTarget);
    formData.append("business_id", business.id);
    if (mainBranch) formData.append("branch_id", mainBranch.id);
    formData.append("service_variant_id", selectedVariant.id);
    formData.append("professional_id", selectedSlot.professional_id);
    formData.append("starts_at", selectedSlot.starts_at);
    formData.append("ends_at", selectedSlot.ends_at);
    formData.append("client_rut", clientRut);
    formData.append("total_price_clp", finalPrice.toString());
    if (discountAmount > 0) formData.append("coupon_code", couponCode);

    try {
      const res = await createAppointmentBooking(formData);
      if (res.error) {
        setBookingError(res.error);
      } else if (res.success && res.appointment) {
        setBookingSuccessData(res.appointment);
        setCurrentStep(5);
      }
    } catch (err: any) {
      setBookingError(err.message || "Error al procesar la reserva.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Descargar .ics
  const handleDownloadICS = () => {
    if (!bookingSuccessData) return;
    downloadICSFile(`cita-${business.slug}`, {
      title: `${bookingSuccessData.service_name} en ${business.name}`,
      description: `Cita con ${bookingSuccessData.professional_name}. Pago en el local: ${formatCLP(bookingSuccessData.total_price_clp)}. Gestionar cita: ${window.location.origin}/reserva/${bookingSuccessData.cancel_token}`,
      location: business.address,
      startsAt: bookingSuccessData.starts_at,
      endsAt: bookingSuccessData.ends_at,
      url: `${window.location.origin}/reserva/${bookingSuccessData.cancel_token}`,
    });
  };

  // Enlace WhatsApp hacia el local con mensaje prellenado
  const whatsappBookingUrl = bookingSuccessData
    ? buildWhatsAppLink(
        business.whatsapp_number,
        "Hola {negocio}, acabo de reservar una cita para *{servicio}* con *{profesional}* el día *{fecha}* a las *{hora}*. Mi nombre es {nombre}. ¡Muchas gracias!",
        {
          negocio: business.name,
          servicio: bookingSuccessData.service_name,
          profesional: bookingSuccessData.professional_name,
          fecha: formatChileanDate(bookingSuccessData.starts_at, "dd/MM/yyyy"),
          hora: formatChileanTime(bookingSuccessData.starts_at),
          nombre: bookingSuccessData.client_name,
        }
      )
    : "";

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Barra de progreso de pasos */}
      {currentStep < 5 && (
        <div className="flex items-center justify-between px-2">
          {[
            { step: 1, label: "Servicio", icon: Scissors },
            { step: 2, label: "Profesional", icon: Users },
            { step: 3, label: "Fecha y Hora", icon: CalendarIcon },
            { step: 4, label: "Mis Datos", icon: User },
          ].map((item) => {
            const Icon = item.icon;
            const isDone = currentStep > item.step;
            const isCurrent = currentStep === item.step;

            return (
              <div
                key={item.step}
                className={`flex items-center gap-2 ${
                  isCurrent
                    ? "text-pink-600 font-bold"
                    : isDone
                    ? "text-neutral-900 dark:text-neutral-100"
                    : "text-neutral-400"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-colors ${
                    isCurrent
                      ? "bg-pink-600 text-white shadow-md shadow-pink-200 dark:shadow-none"
                      : isDone
                      ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                      : "bg-neutral-200 dark:bg-neutral-800 text-neutral-500"
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" /> : item.step}
                </div>
                <span className="hidden sm:inline text-xs">{item.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          PASO 1: SELECCIÓN DE SERVICIO Y VARIANTE
          ======================================================== */}
      {currentStep === 1 && (
        <Card className="border-neutral-200 dark:border-neutral-800 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2 text-pink-600 font-semibold text-xs uppercase tracking-wider">
              <Scissors className="w-4 h-4" /> Paso 1 de 4
            </div>
            <CardTitle className="text-xl">Elige tu servicio</CardTitle>
            <CardDescription>
              Selecciona el servicio y la variante adecuada para ti
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {categories.map((cat) => {
              const catServices = services.filter((s) => s.category_id === cat.id);
              if (catServices.length === 0) return null;

              return (
                <div key={cat.id} className="space-y-3">
                  <h4 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                    {cat.name}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {catServices.flatMap((srv) =>
                      (srv.service_variants || []).map((variant: any) => {
                        const isSelected = selectedVariant?.id === variant.id;
                        return (
                          <div
                            key={variant.id}
                            onClick={() => {
                              setSelectedVariant({
                                ...variant,
                                service_name: srv.name,
                              });
                            }}
                            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? "border-pink-600 bg-pink-50/50 dark:bg-pink-950/20 ring-2 ring-pink-500 shadow-sm"
                                : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900/40"
                            }`}
                          >
                            <div className="space-y-1">
                              <p className="font-bold text-sm text-neutral-900 dark:text-white">
                                {srv.name}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {variant.name}
                              </p>
                            </div>

                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                              <span className="text-xs text-neutral-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {variant.duration_minutes} min
                              </span>
                              <span className="font-extrabold text-sm text-pink-600">
                                {formatCLP(variant.price_clp)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}

            {/* Aplicación de Cupón de Descuento */}
            {selectedVariant && (
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <Tag className="w-4 h-4 text-pink-600" />
                    <span>¿Tienes un cupón de descuento?</span>
                  </div>
                  {discountAmount > 0 && (
                    <Badge variant="success" className="text-xs">
                      Descuento aplicado: -{formatCLP(discountAmount)}
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Ej. BIENVENIDA10"
                    className="text-xs uppercase font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleApplyCoupon}
                    size="sm"
                  >
                    Aplicar
                  </Button>
                </div>
                {couponFeedback && (
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    {couponFeedback}
                  </p>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-between border-t border-neutral-100 dark:border-neutral-800">
            <div className="text-xs text-neutral-500">
              {selectedVariant ? (
                <span>
                  Total:{" "}
                  <strong className="text-base text-pink-600">
                    {formatCLP(finalPrice)}
                  </strong>{" "}
                  (pago en el local)
                </span>
              ) : (
                "Selecciona un servicio para continuar"
              )}
            </div>
            <Button
              disabled={!selectedVariant}
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-2"
            >
              Continuar
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ========================================================
          PASO 2: SELECCIÓN DE PROFESIONAL
          ======================================================== */}
      {currentStep === 2 && (
        <Card className="border-neutral-200 dark:border-neutral-800 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2 text-pink-600 font-semibold text-xs uppercase tracking-wider">
              <Users className="w-4 h-4" /> Paso 2 de 4
            </div>
            <CardTitle className="text-xl">Selecciona un profesional</CardTitle>
            <CardDescription>
              Elige tu estilista de preferencia o selecciona &quot;Cualquiera disponible&quot; para mayor cantidad de horarios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Opción 1: Cualquiera disponible */}
            <div
              onClick={() => setSelectedProfessional(null)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                selectedProfessional === null
                  ? "border-pink-600 bg-pink-50/50 dark:bg-pink-950/20 ring-2 ring-pink-500 shadow-sm"
                  : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-600 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm">Cualquiera disponible (Recomendado)</p>
                  <p className="text-xs text-neutral-500">
                    Te mostraremos todos los horarios libres de cualquier profesional del equipo
                  </p>
                </div>
              </div>
              <Badge variant="default" className="text-xs">
                Más horarios
              </Badge>
            </div>

            {/* Opciones por profesional */}
            {professionals
              .filter((p) => {
                // Filtrar profesionales que realizan esta variante
                return professionalServices.some(
                  (ps) =>
                    ps.professional_id === p.id &&
                    ps.service_variant_id === selectedVariant?.id &&
                    ps.is_active
                );
              })
              .map((prof) => {
                const isSelected = selectedProfessional?.id === prof.id;

                return (
                  <div
                    key={prof.id}
                    onClick={() => setSelectedProfessional(prof)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "border-pink-600 bg-pink-50/50 dark:bg-pink-950/20 ring-2 ring-pink-500 shadow-sm"
                        : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex items-center justify-center font-bold text-neutral-600 dark:text-neutral-300">
                        {prof.photo_url ? (
                          <img
                            src={prof.photo_url}
                            alt={prof.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          prof.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{prof.name}</p>
                        <p className="text-xs text-neutral-500">
                          {prof.specialties?.join(" • ") || "Especialista"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </CardContent>
          <CardFooter className="justify-between border-t border-neutral-100 dark:border-neutral-800">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <Button
              onClick={() => setCurrentStep(3)}
              className="flex items-center gap-2"
            >
              Ver horarios disponibles
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ========================================================
          PASO 3: SELECCIÓN DE FECHA Y HORA DISPONIBLE
          ======================================================== */}
      {currentStep === 3 && (
        <Card className="border-neutral-200 dark:border-neutral-800 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2 text-pink-600 font-semibold text-xs uppercase tracking-wider">
              <CalendarIcon className="w-4 h-4" /> Paso 3 de 4
            </div>
            <CardTitle className="text-xl">Elige fecha y hora</CardTitle>
            <CardDescription>
              Solo se muestran horarios realmente libres calculados en tiempo real
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Selector de Fecha */}
            <div className="space-y-2">
              <Label htmlFor="date-select" required>
                Fecha de la cita
              </Label>
              <Input
                id="date-select"
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split("T")[0]}
                max={
                  new Date(Date.now() + (rules.max_advance_days || 60) * 86400000)
                    .toISOString()
                    .split("T")[0]
                }
                onChange={(e) => setSelectedDate(e.target.value)}
                className="max-w-xs"
              />
            </div>

            {/* Grid de Slots */}
            <div className="space-y-3">
              <Label>Horarios disponibles para el {selectedDate}:</Label>

              {isLoadingSlots ? (
                <div className="py-8 text-center text-sm text-neutral-500 animate-pulse">
                  Consultando disponibilidad en tiempo real...
                </div>
              ) : slots.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 text-center space-y-3">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    No hay horarios disponibles para esta fecha o profesional.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowWaitlist(true)}
                    className="text-xs"
                  >
                    Unirme a la lista de espera para esta fecha
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {slots.map((slot, idx) => {
                    const isSelected = selectedSlot?.starts_at === slot.starts_at;
                    const timeLabel = formatChileanTime(slot.starts_at, "HH:mm");

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                          isSelected
                            ? "border-pink-600 bg-pink-600 text-white font-bold shadow-md shadow-pink-200 dark:shadow-none"
                            : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 hover:border-pink-300"
                        }`}
                      >
                        <p className="text-sm font-semibold">{timeLabel}</p>
                        {selectedProfessional === null && (
                          <p className="text-[10px] truncate opacity-75 mt-0.5">
                            {slot.professional_name.split(" ")[0]}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="justify-between border-t border-neutral-100 dark:border-neutral-800">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <Button
              disabled={!selectedSlot}
              onClick={() => setCurrentStep(4)}
              className="flex items-center gap-2"
            >
              Continuar con mis datos
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ========================================================
          PASO 4: DATOS DEL CLIENTE Y CONFIRMACIÓN
          ======================================================== */}
      {currentStep === 4 && (
        <form onSubmit={handleConfirmBooking}>
          <Card className="border-neutral-200 dark:border-neutral-800 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2 text-pink-600 font-semibold text-xs uppercase tracking-wider">
                <User className="w-4 h-4" /> Paso 4 de 4
              </div>
              <CardTitle className="text-xl">Ingresa tus datos de contacto</CardTitle>
              <CardDescription>
                No necesitas crear una cuenta. Te enviaremos tu confirmación y enlace de gestión por correo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {bookingError && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 dark:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-900">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bookingError}</span>
                </div>
              )}

              {/* Resumen Superior */}
              <div className="p-3.5 rounded-xl bg-pink-50/60 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900/40 text-xs space-y-1">
                <p>
                  <strong className="text-neutral-900 dark:text-neutral-100">Servicio:</strong>{" "}
                  {selectedVariant?.service_name} ({selectedVariant?.name})
                </p>
                <p>
                  <strong className="text-neutral-900 dark:text-neutral-100">Atiende:</strong>{" "}
                  {selectedSlot?.professional_name}
                </p>
                <p>
                  <strong className="text-neutral-900 dark:text-neutral-100">Fecha y hora:</strong>{" "}
                  {selectedSlot && formatChileanDate(selectedSlot.starts_at)} a las{" "}
                  {selectedSlot && formatChileanTime(selectedSlot.starts_at)}
                </p>
                <p className="font-bold text-pink-600 text-sm pt-1">
                  Total a pagar: {formatCLP(finalPrice)} (en el local)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="client_name" required>
                    Nombre y Apellido
                  </Label>
                  <Input
                    id="client_name"
                    name="client_name"
                    placeholder="Ej. Sofía Martínez"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="client_rut" required>
                    RUT Chileno
                  </Label>
                  <Input
                    id="client_rut"
                    value={clientRut}
                    onChange={handleRutChange}
                    placeholder="12.345.678-9"
                    error={rutError || undefined}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="client_phone" required>
                    Teléfono móvil (+56)
                  </Label>
                  <Input
                    id="client_phone"
                    name="client_phone"
                    type="tel"
                    placeholder="+56 9 8765 4321"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="client_email" required>
                    Correo electrónico
                  </Label>
                  <Input
                    id="client_email"
                    name="client_email"
                    type="email"
                    placeholder="sofia@ejemplo.cl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="client_notes">
                  Notas o comentarios para tu atención (opcional)
                </Label>
                <Textarea
                  id="client_notes"
                  name="client_notes"
                  placeholder="Ej. Tengo el cabello con decoloración previa, primera vez en el salón..."
                  rows={2}
                />
              </div>

              {/* Casilla de Consentimiento y Política de Pago */}
              <div className="pt-2 space-y-2">
                <label className="flex items-start gap-2.5 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    defaultChecked
                    className="mt-0.5 rounded text-pink-600 focus:ring-pink-500"
                  />
                  <span>
                    Acepto el tratamiento de mis datos personales para la gestión de esta reserva conforme a la Ley de Protección de Datos Personales de Chile.
                  </span>
                </label>

                <div className="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[11px] text-neutral-500">
                  ℹ️ <strong>Importante:</strong> El pago se efectúa directamente en el local al término de tu atención. Puedes pagar con tarjetas o efectivo.
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-between border-t border-neutral-100 dark:border-neutral-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(3)}
              >
                Volver
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting}
                className="bg-pink-600 hover:bg-pink-700 text-white font-semibold"
              >
                Confirmar mi Reserva
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}

      {/* ========================================================
          PASO 5: PANTALLA DE ÉXITO Y GESTIÓN SIN CUENTA
          ======================================================== */}
      {currentStep === 5 && bookingSuccessData && (
        <Card className="border-emerald-200 dark:border-emerald-900 bg-white dark:bg-neutral-900 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white text-center space-y-2">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              ¡Tu Cita está Confirmada!
            </h2>
            <p className="text-emerald-100 text-sm">
              Te esperamos en {business.name}
            </p>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Detalle de la cita */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
              <div>
                <span className="text-neutral-500">Servicio</span>
                <p className="font-bold text-sm text-neutral-900 dark:text-white mt-0.5">
                  {bookingSuccessData.service_name}
                </p>
              </div>

              <div>
                <span className="text-neutral-500">Profesional</span>
                <p className="font-bold text-sm text-neutral-900 dark:text-white mt-0.5">
                  {bookingSuccessData.professional_name}
                </p>
              </div>

              <div>
                <span className="text-neutral-500">Fecha y Hora</span>
                <p className="font-bold text-sm text-neutral-900 dark:text-white mt-0.5">
                  {formatChileanDate(bookingSuccessData.starts_at)} a las{" "}
                  {formatChileanTime(bookingSuccessData.starts_at)}
                </p>
              </div>

              <div>
                <span className="text-neutral-500">Lugar</span>
                <p className="font-bold text-sm text-neutral-900 dark:text-white mt-0.5">
                  {business.address}
                </p>
              </div>

              <div className="sm:col-span-2 pt-2 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                <span className="text-neutral-500">Total a pagar en el local</span>
                <span className="font-extrabold text-base text-pink-600">
                  {formatCLP(bookingSuccessData.total_price_clp)}
                </span>
              </div>
            </div>

            {/* Acciones principales del cliente */}
            <div className="space-y-3">
              {/* Botón WhatsApp */}
              {whatsappBookingUrl && (
                <Button
                  variant="whatsapp"
                  className="w-full h-11 text-sm flex items-center justify-center gap-2"
                  onClick={() => window.open(whatsappBookingUrl, "_blank")}
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Enviar mis datos por WhatsApp al local</span>
                </Button>
              )}

              {/* Botón Descargar Calendario */}
              <Button
                variant="outline"
                className="w-full h-11 text-sm flex items-center justify-center gap-2"
                onClick={handleDownloadICS}
              >
                <Download className="w-4 h-4" />
                <span>Agregar a mi Calendario (.ics / Google)</span>
              </Button>
            </div>

            {/* Enlace de Gestión sin cuenta */}
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 space-y-2">
              <p className="font-semibold text-xs text-neutral-800 dark:text-neutral-200">
                Tu enlace único de gestión (guárdalo o búscalo en tu correo):
              </p>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/reserva/${bookingSuccessData.cancel_token}`}
                  className="text-xs font-mono bg-white dark:bg-neutral-950"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/reserva/${bookingSuccessData.cancel_token}`
                    );
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="shrink-0"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-[11px] text-neutral-500">
                Con este enlace podrás ver los detalles de tu cita, reprogramarla o cancelarla sin tener que iniciar sesión.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Lista de Espera */}
      {showWaitlist && selectedVariant && (
        <WaitlistModal
          businessId={business.id}
          serviceVariantId={selectedVariant.id}
          professionalId={selectedProfessional?.id || null}
          serviceName={`${selectedVariant.service_name} (${selectedVariant.name})`}
          onClose={() => setShowWaitlist(false)}
        />
      )}
    </div>
  );
}
