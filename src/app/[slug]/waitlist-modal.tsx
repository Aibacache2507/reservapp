"use client";

import * as React from "react";
import { joinWaitlistAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { X, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface WaitlistModalProps {
  businessId: string;
  serviceVariantId: string;
  professionalId: string | null;
  serviceName: string;
  onClose: () => void;
}

export function WaitlistModal({
  businessId,
  serviceVariantId,
  professionalId,
  serviceName,
  onClose,
}: WaitlistModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ error?: string; success?: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const formData = new FormData(e.currentTarget);
    formData.append("business_id", businessId);
    formData.append("service_variant_id", serviceVariantId);
    if (professionalId) {
      formData.append("professional_id", professionalId);
    }

    try {
      const res = await joinWaitlistAction(formData);
      if (res.error) {
        setFeedback({ error: res.error });
      } else {
        setFeedback({ success: true });
      }
    } catch (err: any) {
      setFeedback({ error: err.message || "Error al unirse a la lista." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-lg bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-pink-600 font-semibold text-xs uppercase tracking-wider">
            <Clock className="w-4 h-4" />
            Sin horarios disponibles
          </div>
          <CardTitle className="text-lg">Unirme a la Lista de Espera</CardTitle>
          <CardDescription>
            Para: <strong className="text-neutral-800 dark:text-neutral-200">{serviceName}</strong>.
            Si un cliente cancela o se libera un cupo, te avisaremos de inmediato por WhatsApp y correo.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {feedback?.success ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-base">¡Anotado en lista de espera!</h4>
                <p className="text-xs text-neutral-500">
                  Te avisaremos apenas se libere un horario disponible.
                </p>
              </div>
              <Button onClick={onClose} className="w-full">
                Entendido
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {feedback?.error && (
                <div className="flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 dark:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-900">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{feedback.error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label required className="text-xs">
                    Rango desde
                  </Label>
                  <Input
                    name="preferred_date_start"
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Hasta</Label>
                  <Input name="preferred_date_end" type="date" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label required className="text-xs">
                    Nombre completo
                  </Label>
                  <Input name="full_name" placeholder="Ej. Sofía Martínez" required />
                </div>
                <div className="space-y-1">
                  <Label required className="text-xs">
                    RUT (Chile)
                  </Label>
                  <Input name="rut" placeholder="18.234.567-9" required />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label required className="text-xs">
                    Teléfono / WhatsApp
                  </Label>
                  <Input
                    name="phone"
                    type="tel"
                    placeholder="+56 9 8765 4321"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label required className="text-xs">
                    Correo electrónico
                  </Label>
                  <Input
                    name="email"
                    type="email"
                    placeholder="sofia@ejemplo.cl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Preferencia horaria o notas</Label>
                <Textarea
                  name="notes"
                  placeholder="Ej. Prefiero tardes después de las 17:00 hrs..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  Anotarme en la lista
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
