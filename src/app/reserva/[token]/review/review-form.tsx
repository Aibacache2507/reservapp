"use client";

import * as React from "react";
import Link from "next/link";
import { submitAppointmentReview, type ReviewActionResult } from "./actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Star, CheckCircle2, AlertCircle, ArrowLeft, Heart } from "lucide-react";

interface ReviewFormProps {
  token: string;
  businessName: string;
  serviceName: string;
  professionalName: string;
  existingReview?: {
    rating: number;
    comment: string | null;
    created_at: string;
    business_reply?: string | null;
  } | null;
}

const STAR_LABELS: Record<number, string> = {
  5: "¡Excelente! Me encantó la atención ✨",
  4: "Muy buena experiencia 👍",
  3: "Buena atención 🙂",
  2: "Regular, puede mejorar 😐",
  1: "Mala experiencia 🙁",
};

export function ReviewForm({
  token,
  businessName,
  serviceName,
  professionalName,
  existingReview,
}: ReviewFormProps) {
  const [rating, setRating] = React.useState<number>(existingReview?.rating || 5);
  const [hoverRating, setHoverRating] = React.useState<number>(0);
  const [comment, setComment] = React.useState<string>(existingReview?.comment || "");
  const [submitted, setSubmitted] = React.useState<boolean>(!!existingReview);
  const [feedback, setFeedback] = React.useState<ReviewActionResult | null>(null);

  if (submitted || existingReview) {
    const finalRating = existingReview?.rating || rating;
    const finalComment = existingReview?.comment || comment;

    return (
      <Card className="max-w-lg mx-auto text-center border-neutral-200 dark:border-neutral-800 shadow-md">
        <CardContent className="p-8 space-y-4">
          <div className="w-14 h-14 rounded-full bg-pink-100 dark:bg-pink-900/40 text-pink-600 flex items-center justify-center mx-auto">
            <Heart className="w-7 h-7 fill-pink-600" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight">¡Muchas gracias por tu reseña!</h2>
            <p className="text-xs text-neutral-500">
              Tu opinión sobre <strong>{businessName}</strong> nos ayuda a seguir brindándote la mejor atención.
            </p>
          </div>

          {/* Calificación registrada */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-700/60 space-y-2 text-xs">
            <div className="flex justify-center text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-5 h-5 ${s <= finalRating ? "fill-amber-400" : "text-neutral-300"}`}
                />
              ))}
            </div>
            {finalComment && (
              <p className="italic text-neutral-600 dark:text-neutral-300">
                "{finalComment}"
              </p>
            )}
            {existingReview?.business_reply && (
              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 text-left text-[11px] text-pink-700 dark:text-pink-300">
                <p className="font-bold">Respuesta del local:</p>
                <p>{existingReview.business_reply}</p>
              </div>
            )}
          </div>

          <div className="pt-2">
            <Link
              href={`/reserva/${token}`}
              className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver al resumen de mi cita</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg mx-auto border-neutral-200 dark:border-neutral-800 shadow-md">
      <CardHeader className="text-center pb-2">
        <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900/40 text-pink-600 flex items-center justify-center mx-auto mb-2">
          <Star className="w-6 h-6 fill-pink-600" />
        </div>
        <CardTitle className="text-lg font-bold">¿Cómo estuvo tu cita?</CardTitle>
        <CardDescription className="text-xs">
          Cuéntanos tu experiencia con <strong>{professionalName}</strong> en <strong>{businessName}</strong> ({serviceName})
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-2">
        {feedback?.error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{feedback.error}</span>
          </div>
        )}

        <form
          action={async (formData) => {
            const res = await submitAppointmentReview(formData);
            setFeedback(res);
            if (res.success) setSubmitted(true);
          }}
          className="space-y-4"
        >
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="rating" value={rating} />

          {/* Selector Interactivo de Estrellas */}
          <div className="space-y-1.5 text-center">
            <Label className="text-xs text-neutral-500">Puntúa tu experiencia:</Label>
            <div className="flex justify-center items-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map((s) => {
                const isActive = (hoverRating || rating) >= s;
                return (
                  <button
                    key={s}
                    type="button"
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(s)}
                    className="p-1 text-neutral-300 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        isActive ? "fill-amber-400 text-amber-400" : "text-neutral-300"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-xs font-semibold text-pink-600 h-4">
              {STAR_LABELS[hoverRating || rating] || ""}
            </p>
          </div>

          {/* Comentario Opcional */}
          <div className="space-y-1">
            <Label className="text-xs">Tu comentario u opinión (opcional):</Label>
            <Textarea
              name="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="¿Qué te pareció el resultado, la puntualidad o la atención del estilista?"
              rows={3}
              className="text-xs"
            />
          </div>

          <Button type="submit" className="w-full text-xs font-bold py-2.5">
            Enviar mi Calificación
          </Button>

          <div className="text-center">
            <Link
              href={`/reserva/${token}`}
              className="text-[11px] text-neutral-400 hover:underline"
            >
              Cancelar y volver a mi cita
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
