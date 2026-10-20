"use client";

import * as React from "react";
import { formatCLP } from "@/lib/utils/chile";
import {
  createCoupon,
  deleteCoupon,
  createPack,
  deletePack,
  type PromoActionResult,
} from "./actions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag, Package, Plus, Trash2, Calendar, DollarSign, Percent, CheckCircle2, AlertCircle } from "lucide-react";

interface PromotionsViewProps {
  business: any;
  coupons: any[];
  packs: any[];
}

export function PromotionsView({
  business,
  coupons: initialCoupons,
  packs: initialPacks,
}: PromotionsViewProps) {
  const [coupons, setCoupons] = React.useState(initialCoupons);
  const [packs, setPacks] = React.useState(initialPacks);

  const [showCouponForm, setShowCouponForm] = React.useState(false);
  const [showPackForm, setShowPackForm] = React.useState(false);
  const [feedback, setFeedback] = React.useState<PromoActionResult | null>(null);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Promociones, Cupones y Packs
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Crea cupones de descuento aplicables al reservar online y packs prepagados de sesiones
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

      <Tabs defaultValue="coupons">
        <TabsList className="mb-4">
          <TabsTrigger value="coupons" className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            <span>Cupones de Descuento ({coupons.length})</span>
          </TabsTrigger>
          <TabsTrigger value="packs" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            <span>Packs de Sesiones ({packs.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* PESTAÑA CUPONES */}
        <TabsContent value="coupons" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold">Cupones para Clientes</h3>
              <p className="text-xs text-neutral-500">
                Los clientes ingresan el código antes de confirmar su hora
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setShowCouponForm(!showCouponForm)}
              className="text-xs"
            >
              <Plus className="w-4 h-4 mr-1" />
              Nuevo Cupón
            </Button>
          </div>

          {/* Formulario Crear Cupón */}
          {showCouponForm && (
            <Card className="border-pink-200 bg-pink-50/30 dark:border-pink-900 dark:bg-pink-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Crear Cupón de Descuento</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  action={async (formData) => {
                    const res = await createCoupon(formData);
                    setFeedback(res);
                    if (res.success) setShowCouponForm(false);
                  }}
                  className="space-y-4 text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label required>Código del cupón (mayúsculas)</Label>
                      <Input
                        name="code"
                        placeholder="Ej. VERANO20, CLIENTANUEVA"
                        className="uppercase font-mono"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label required>Tipo de descuento</Label>
                      <select
                        name="discount_type"
                        className="flex h-10 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs"
                      >
                        <option value="percentage">Porcentaje (%)</option>
                        <option value="fixed_amount">Monto Fijo en CLP ($)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label required>Valor del descuento</Label>
                      <Input
                        name="discount_value"
                        type="number"
                        placeholder="Ej. 15 o 5000"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label>Límite máximo de usos (opcional)</Label>
                      <Input
                        name="max_uses"
                        type="number"
                        placeholder="Ej. 50 (vacío para ilimitado)"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>Válido desde</Label>
                      <Input
                        name="valid_from"
                        type="date"
                        defaultValue={new Date().toISOString().split("T")[0]}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label required>Válido hasta</Label>
                      <Input
                        name="valid_until"
                        type="date"
                        defaultValue={
                          new Date(Date.now() + 30 * 86400000)
                            .toISOString()
                            .split("T")[0]
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowCouponForm(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">Guardar Cupón</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Listado de Cupones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {coupons.length === 0 ? (
              <p className="col-span-full py-8 text-center text-xs text-neutral-400">
                No hay cupones creados aún.
              </p>
            ) : (
              coupons.map((c) => (
                <Card key={c.id} className="flex flex-col justify-between">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-pink-600 font-mono tracking-wider">
                        {c.code}
                      </span>
                      <button
                        onClick={async () => {
                          if (confirm(`¿Eliminar cupón ${c.code}?`)) {
                            const res = await deleteCoupon(c.id);
                            setFeedback(res);
                            setCoupons((prev) => prev.filter((item) => item.id !== c.id));
                          }
                        }}
                        className="text-neutral-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <CardTitle className="text-base font-bold">
                      {c.discount_type === "percentage"
                        ? `${c.discount_value}% OFF`
                        : `${formatCLP(c.discount_value)} OFF`}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="text-xs space-y-1 pt-0 text-neutral-500">
                    <p>
                      Usos: <strong>{c.uses_count || 0}</strong>
                      {c.max_uses ? ` / ${c.max_uses}` : " (ilimitado)"}
                    </p>
                    <p className="text-[11px]">
                      Vence: {c.valid_until || "Sin vencimiento"}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* PESTAÑA PACKS */}
        <TabsContent value="packs" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold">Packs de Sesiones</h3>
              <p className="text-xs text-neutral-500">
                Paquetes de varias sesiones con precio especial
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setShowPackForm(!showPackForm)}
              className="text-xs"
            >
              <Plus className="w-4 h-4 mr-1" />
              Nuevo Pack
            </Button>
          </div>

          {/* Formulario Crear Pack */}
          {showPackForm && (
            <Card className="border-pink-200 bg-pink-50/30 dark:border-pink-900 dark:bg-pink-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Crear Pack de Sesiones</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  action={async (formData) => {
                    const res = await createPack(formData);
                    setFeedback(res);
                    if (res.success) setShowPackForm(false);
                  }}
                  className="space-y-4 text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label required>Nombre del pack</Label>
                      <Input
                        name="name"
                        placeholder="Ej. Pack 4 Sesiones Manicure Rusa"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Descripción breve</Label>
                      <Input
                        name="description"
                        placeholder="Incluye retiro y esmaltado..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label required>Total de sesiones</Label>
                      <Input
                        name="total_sessions"
                        type="number"
                        defaultValue={4}
                        min={2}
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label required>Precio total (CLP)</Label>
                      <Input
                        name="price_clp"
                        type="number"
                        defaultValue={80000}
                        step={1000}
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>Validez en días</Label>
                      <Input
                        name="validity_days"
                        type="number"
                        defaultValue={90}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowPackForm(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">Guardar Pack</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Listado de Packs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {packs.length === 0 ? (
              <p className="col-span-full py-8 text-center text-xs text-neutral-400">
                No hay packs creados aún.
              </p>
            ) : (
              packs.map((p) => (
                <Card key={p.id} className="flex flex-col justify-between">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="default" className="text-[10px]">
                        {p.total_sessions} Sesiones
                      </Badge>
                      <button
                        onClick={async () => {
                          if (confirm(`¿Eliminar pack ${p.name}?`)) {
                            const res = await deletePack(p.id);
                            setFeedback(res);
                            setPacks((prev) => prev.filter((item) => item.id !== p.id));
                          }
                        }}
                        className="text-neutral-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <CardTitle className="text-sm font-bold mt-1">
                      {p.name}
                    </CardTitle>
                    {p.description && (
                      <CardDescription className="text-xs">{p.description}</CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="text-xs space-y-1 pt-0">
                    <p className="font-extrabold text-base text-pink-600">
                      {formatCLP(p.price_clp)}
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      Válido por {p.validity_days} días desde la compra
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
