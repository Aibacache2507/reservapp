"use client";

import * as React from "react";
import { formatCLP, formatDisplayPhone } from "@/lib/utils/chile";
import { formatChileanDate } from "@/lib/utils/dates";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";
import {
  toggleReviewPublic,
  replyToReviewAction,
  type LoyaltyActionResult,
} from "./actions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Trophy,
  MessageSquare,
  Eye,
  EyeOff,
  Reply,
  CheckCircle2,
  AlertCircle,
  Package,
  Heart,
  TrendingUp,
} from "lucide-react";

interface FrequentClient {
  id: string;
  name: string;
  rut: string;
  phone: string;
  email: string;
  totalVisits: number;
  totalSpentClp: number;
  lastVisitDate: string | null;
}

interface ReviewRecord {
  id: string;
  business_id: string;
  rating: number;
  comment: string | null;
  is_public: boolean;
  business_reply: string | null;
  reply_at: string | null;
  created_at: string;
  clients?: {
    name: string;
    rut: string;
  };
  professionals?: {
    name: string;
  };
}

interface LoyaltyViewProps {
  business: any;
  frequentClients: FrequentClient[];
  reviews: ReviewRecord[];
  packs: any[];
}

export function LoyaltyView({
  business,
  frequentClients,
  reviews: initialReviews,
  packs,
}: LoyaltyViewProps) {
  const [reviews, setReviews] = React.useState(initialReviews);
  const [replyingReviewId, setReplyingReviewId] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<LoyaltyActionResult | null>(null);

  // Promedio de puntuación de reseñas
  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "5.0";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Fidelización, Reseñas y Clientes Frecuentes
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Identifica a tus clientes más fieles, modera reseñas para tu página web y gestiona beneficios de fidelidad
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

      {/* Métricas Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-amber-200 bg-amber-50/20 dark:border-amber-900/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Calificación Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">
                {averageRating}
              </span>
              <div className="flex text-amber-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.round(Number(averageRating))
                        ? "fill-amber-400 text-amber-400"
                        : "text-neutral-300"
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              Basado en {reviews.length} reseña(s) de clientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Clientes VIP / Frecuentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-pink-600">
              {frequentClients.length}
            </p>
            <p className="text-[11px] text-neutral-500 mt-1">
              Clientes con 2 o más visitas completadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Packs Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-purple-600">
              {packs.length}
            </p>
            <p className="text-[11px] text-neutral-500 mt-1">
              Paquetes de sesiones para fidelizar compras
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList className="grid grid-cols-2 max-w-sm">
          <TabsTrigger value="clients" className="flex items-center gap-1.5 text-xs">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Ranking Clientes VIP</span>
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-1.5 text-xs">
            <Star className="w-3.5 h-3.5 text-pink-500" />
            <span>Reseñas ({reviews.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* PESTAÑA RANKING CLIENTES FRECUENTES */}
        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                Clientes con Mayor Fidelidad y Gasto Acumulado (LTV)
              </CardTitle>
              <CardDescription className="text-xs">
                Premia a tus mejores clientes con promociones exclusivas o mensajes de fidelidad por WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              {frequentClients.length === 0 ? (
                <p className="py-8 text-center text-xs text-neutral-400">
                  Aún no hay clientes recurrentes registrados con citas completadas.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 text-[11px] uppercase">
                        <th className="py-2.5 px-3">Lugar</th>
                        <th className="py-2.5 px-3">Cliente</th>
                        <th className="py-2.5 px-3">Contacto</th>
                        <th className="py-2.5 px-3 text-center">Visitas</th>
                        <th className="py-2.5 px-3 text-right">Gasto Acumulado</th>
                        <th className="py-2.5 px-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      {frequentClients.map((client, idx) => {
                        const waMsg = `¡Hola ${client.name}! En ${business.name} valoramos mucho tu fidelidad. Como eres una de nuestras clientas favoritas, queremos agradecerte por tus visitas. ¡Te esperamos pronto! ✨`;
                        const waLink = buildWhatsAppLink(client.phone, waMsg);

                        return (
                          <tr key={client.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40">
                            <td className="py-3 px-3">
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                                  idx === 0
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                                    : idx === 1
                                    ? "bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300"
                                    : idx === 2
                                    ? "bg-amber-50 text-amber-800"
                                    : "text-neutral-400"
                                }`}
                              >
                                {idx + 1}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <p className="font-bold text-neutral-900 dark:text-neutral-100">
                                {client.name}
                              </p>
                              <p className="text-[11px] text-neutral-400 font-mono">
                                {client.rut || "Sin RUT"}
                              </p>
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] text-neutral-500">
                              <p>{formatDisplayPhone(client.phone)}</p>
                              <p className="text-[10px] text-neutral-400 font-sans">{client.email}</p>
                            </td>
                            <td className="py-3 px-3 text-center font-bold">
                              <Badge variant="secondary" className="text-xs">
                                {client.totalVisits} visitas
                              </Badge>
                            </td>
                            <td className="py-3 px-3 text-right font-extrabold text-pink-600">
                              {formatCLP(client.totalSpentClp)}
                            </td>
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 transition-colors"
                                title="Enviar beneficio por WhatsApp"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>Premio WA</span>
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PESTAÑA RESEÑAS */}
        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Star className="w-4 h-4 text-pink-600" />
                Moderación de Reseñas de Clientes
              </CardTitle>
              <CardDescription className="text-xs">
                Elige qué reseñas destacar públicamente en tu página web y responde a tus clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <p className="py-8 text-center text-xs text-neutral-400">
                  Aún no has recibido reseñas de clientes.
                </p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-2.5 text-xs"
                    >
                      {/* Cabecera de la reseña */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-neutral-900 dark:text-neutral-100">
                            {rev.clients?.name || "Cliente"}
                          </span>
                          <span className="text-neutral-400">•</span>
                          <span className="text-neutral-500">
                            Atendida por {rev.professionals?.name || "Profesional"}
                          </span>
                          <span className="text-neutral-400">•</span>
                          <span className="text-neutral-400 font-mono text-[11px]">
                            {formatChileanDate(rev.created_at)}
                          </span>
                        </div>

                        {/* Visibilidad pública */}
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={rev.is_public ? "success" : "secondary"}
                            className="text-[10px]"
                          >
                            {rev.is_public ? "Visible en web" : "Oculta"}
                          </Badge>

                          <button
                            type="button"
                            onClick={async () => {
                              const res = await toggleReviewPublic(rev.id, !rev.is_public);
                              setFeedback(res);
                              if (res.success) {
                                setReviews((prev) =>
                                  prev.map((r) =>
                                    r.id === rev.id ? { ...r, is_public: !r.is_public } : r
                                  )
                                );
                              }
                            }}
                            className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 p-1 cursor-pointer"
                            title={rev.is_public ? "Ocultar de la página pública" : "Mostrar en la página pública"}
                          >
                            {rev.is_public ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Estrellas */}
                      <div className="flex text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= rev.rating ? "fill-amber-400" : "text-neutral-300"
                            }`}
                          />
                        ))}
                      </div>

                      {/* Comentario del cliente */}
                      {rev.comment && (
                        <p className="text-neutral-700 dark:text-neutral-300 italic bg-white dark:bg-neutral-800 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-700">
                          "{rev.comment}"
                        </p>
                      )}

                      {/* Respuesta del negocio existente */}
                      {rev.business_reply && (
                        <div className="pl-3 border-l-2 border-pink-500 text-[11px] text-pink-900 dark:text-pink-300 space-y-0.5">
                          <p className="font-bold flex items-center gap-1">
                            <Reply className="w-3 h-3 rotate-180" />
                            Respuesta de {business.name}:
                          </p>
                          <p>{rev.business_reply}</p>
                        </div>
                      )}

                      {/* Formulario de respuesta */}
                      {replyingReviewId === rev.id ? (
                        <form
                          action={async (formData) => {
                            const res = await replyToReviewAction(formData);
                            setFeedback(res);
                            if (res.success) {
                              setReplyingReviewId(null);
                              const replyText = formData.get("reply_text") as string;
                              setReviews((prev) =>
                                prev.map((r) =>
                                  r.id === rev.id ? { ...r, business_reply: replyText } : r
                                )
                              );
                            }
                          }}
                          className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800"
                        >
                          <input type="hidden" name="review_id" value={rev.id} />
                          <Label className="text-[11px]">Escribir respuesta oficial:</Label>
                          <Textarea
                            name="reply_text"
                            placeholder="Agradece el comentario de tu cliente..."
                            defaultValue={rev.business_reply || ""}
                            rows={2}
                            className="text-xs"
                            required
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setReplyingReviewId(null)}
                              className="text-xs h-7"
                            >
                              Cancelar
                            </Button>
                            <Button type="submit" size="sm" className="text-xs h-7">
                              Publicar Respuesta
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => setReplyingReviewId(rev.id)}
                            className="text-pink-600 hover:text-pink-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Reply className="w-3 h-3" />
                            <span>{rev.business_reply ? "Editar respuesta" : "Responder al cliente"}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
