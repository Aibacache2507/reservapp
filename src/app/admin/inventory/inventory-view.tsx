"use client";

import * as React from "react";
import { formatCLP } from "@/lib/utils/chile";
import { formatChileanDate, formatChileanTime } from "@/lib/utils/dates";
import {
  createInventoryItem,
  recordInventoryMovement,
  deleteInventoryItem,
  type InventoryActionResult,
} from "./actions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  History,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
} from "lucide-react";

interface InventoryItem {
  id: string;
  business_id: string;
  name: string;
  sku: string | null;
  description: string | null;
  current_stock: number;
  min_stock_alert: number;
  unit_cost_clp: number;
  created_at: string;
}

interface InventoryMovement {
  id: string;
  business_id: string;
  item_id: string;
  movement_type: "in" | "out" | "adjustment" | "consumed_in_service";
  quantity: number;
  unit_cost_clp: number;
  reason: string | null;
  created_at: string;
  inventory_items?: {
    name: string;
  };
}

interface InventoryViewProps {
  business: any;
  items: InventoryItem[];
  movements: InventoryMovement[];
}

const MOVEMENT_LABELS: Record<string, string> = {
  in: "Entrada (Compra)",
  out: "Salida (Venta)",
  consumed_in_service: "Consumo en Servicio",
  adjustment: "Ajuste de Stock",
};

export function InventoryView({
  business,
  items: initialItems,
  movements: initialMovements,
}: InventoryViewProps) {
  const [items, setItems] = React.useState(initialItems);
  const [movements, setMovements] = React.useState(initialMovements);

  const [searchTerm, setSearchTerm] = React.useState("");
  const [showItemForm, setShowItemForm] = React.useState(false);
  const [showMovementModal, setShowMovementModal] = React.useState(false);
  const [selectedItemForMovement, setSelectedItemForMovement] = React.useState<InventoryItem | null>(null);

  const [feedback, setFeedback] = React.useState<InventoryActionResult | null>(null);

  // Productos con bajo stock
  const lowStockItems = items.filter(
    (item) => Number(item.current_stock) <= Number(item.min_stock_alert)
  );

  // Filtrar productos por búsqueda
  const filteredItems = items.filter((item) => {
    const q = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      (item.sku && item.sku.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Control de Inventario y Stock
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Registro de productos, entradas por compra, salidas, consumo en cabina y alertas de reposición
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            size="sm"
            onClick={() => {
              setSelectedItemForMovement(items[0] || null);
              setShowMovementModal(true);
            }}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Registrar Movimiento
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowItemForm(!showItemForm)}
            className="text-xs"
          >
            <Package className="w-3.5 h-3.5 mr-1" />
            Nuevo Producto
          </Button>
        </div>
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

      {/* Alerta de Bajo Stock */}
      {lowStockItems.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">
                Alerta: {lowStockItems.length} producto(s) con stock crítico o bajo el mínimo
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                {lowStockItems.map((i) => `${i.name} (${i.current_stock} disp.)`).join(", ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Formulario Crear Producto */}
      {showItemForm && (
        <Card className="border-pink-200 bg-pink-50/20 dark:border-pink-900 dark:bg-pink-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold">Agregar Nuevo Producto</CardTitle>
            <CardDescription className="text-xs">
              Registra un producto para venta o insumo de salón
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={async (formData) => {
                const res = await createInventoryItem(formData);
                setFeedback(res);
                if (res.success) setShowItemForm(false);
              }}
              className="space-y-4 text-xs"
            >
              <input type="hidden" name="business_id" value={business.id} />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label required>Nombre del producto</Label>
                  <Input name="name" placeholder="Ej. Shampoo Post-Color 1000ml" required />
                </div>
                <div className="space-y-1">
                  <Label>Código / SKU (opcional)</Label>
                  <Input name="sku" placeholder="Ej. SH-POST-1L" className="font-mono uppercase" />
                </div>
                <div className="space-y-1">
                  <Label>Costo Unitario (CLP)</Label>
                  <Input name="unit_cost_clp" type="number" defaultValue={0} step={100} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label required>Stock Inicial</Label>
                  <Input name="current_stock" type="number" defaultValue={10} min={0} required />
                </div>
                <div className="space-y-1">
                  <Label required>Stock Mínimo para Alerta</Label>
                  <Input name="min_stock_alert" type="number" defaultValue={3} min={1} required />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowItemForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Guardar Producto</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Modal Registrar Movimiento */}
      {showMovementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div>
              <h3 className="font-bold text-base">Registrar Movimiento de Inventario</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Actualiza el stock sumando entradas o descontando consumos y salidas
              </p>
            </div>

            <form
              action={async (formData) => {
                const res = await recordInventoryMovement(formData);
                setFeedback(res);
                if (res.success) setShowMovementModal(false);
              }}
              className="space-y-3 text-xs"
            >
              <input type="hidden" name="business_id" value={business.id} />

              <div className="space-y-1">
                <Label required>Seleccionar Producto</Label>
                <select
                  name="item_id"
                  defaultValue={selectedItemForMovement?.id || ""}
                  className="flex h-9 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs font-medium"
                  required
                >
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name} (Stock actual: {it.current_stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label required>Tipo de Movimiento</Label>
                <select
                  name="movement_type"
                  className="flex h-9 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs font-medium"
                  required
                >
                  <option value="in">➕ Entrada (Compra / Reposición)</option>
                  <option value="consumed_in_service">💇‍♀️ Consumo en Servicio (Cabina/Lavapelo)</option>
                  <option value="out">🛍️ Salida (Venta directa a cliente)</option>
                  <option value="adjustment">⚙️ Ajuste Físico (Conteo real)</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label required>Cantidad</Label>
                <Input name="quantity" type="number" step="0.1" defaultValue={1} min={0.1} required />
              </div>

              <div className="space-y-1">
                <Label>Motivo u observación</Label>
                <Input name="reason" placeholder="Ej. Factura proveedor 4821 / Uso tinte tono 7.1" />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowMovementModal(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Confirmar Movimiento
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pestañas: Productos y Movimientos */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList className="grid grid-cols-2 max-w-xs">
          <TabsTrigger value="products" className="text-xs">
            Productos ({items.length})
          </TabsTrigger>
          <TabsTrigger value="movements" className="text-xs">
            Movimientos ({movements.length})
          </TabsTrigger>
        </TabsList>

        {/* PESTAÑA PRODUCTOS */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex items-center gap-2 max-w-sm">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-400" />
              <Input
                placeholder="Buscar por nombre o SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 text-xs"
              />
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {filteredItems.length === 0 ? (
                <p className="py-8 text-center text-xs text-neutral-400">
                  No se encontraron productos registrados.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 text-[11px] uppercase">
                        <th className="py-2.5 px-4">Producto</th>
                        <th className="py-2.5 px-3">SKU</th>
                        <th className="py-2.5 px-3 text-right">Costo Unitario</th>
                        <th className="py-2.5 px-3 text-center">Stock Actual</th>
                        <th className="py-2.5 px-3 text-center">Mínimo Alerta</th>
                        <th className="py-2.5 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      {filteredItems.map((it) => {
                        const isLow = Number(it.current_stock) <= Number(it.min_stock_alert);

                        return (
                          <tr key={it.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40">
                            <td className="py-3 px-4 font-semibold">
                              <p className="text-neutral-900 dark:text-neutral-100">{it.name}</p>
                              {it.description && (
                                <p className="text-[11px] text-neutral-400 font-normal">{it.description}</p>
                              )}
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] text-neutral-500">
                              {it.sku || "-"}
                            </td>
                            <td className="py-3 px-3 text-right font-medium">
                              {formatCLP(it.unit_cost_clp)}
                            </td>
                            <td className="py-3 px-3 text-center font-bold">
                              <Badge variant={isLow ? "destructive" : "success"} className="text-xs">
                                {it.current_stock}
                              </Badge>
                            </td>
                            <td className="py-3 px-3 text-center text-neutral-500">
                              {it.min_stock_alert}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedItemForMovement(it);
                                    setShowMovementModal(true);
                                  }}
                                  className="text-xs h-7 px-2 text-pink-600 hover:text-pink-700"
                                >
                                  Mover Stock
                                </Button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (confirm(`¿Eliminar producto ${it.name}?`)) {
                                      const res = await deleteInventoryItem(it.id);
                                      setFeedback(res);
                                      if (res.success) {
                                        setItems((prev) => prev.filter((p) => p.id !== it.id));
                                      }
                                    }
                                  }}
                                  className="text-neutral-400 hover:text-red-600 p-1 cursor-pointer"
                                  title="Eliminar producto"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
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

        {/* PESTAÑA HISTORIAL DE MOVIMIENTOS */}
        <TabsContent value="movements">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <History className="w-4 h-4 text-neutral-500" />
                Historial de Movimientos de Inventario
              </CardTitle>
              <CardDescription className="text-xs">
                Auditoría cronológica de compras, consumos en cabina y ventas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {movements.length === 0 ? (
                <p className="py-8 text-center text-xs text-neutral-400">
                  No hay movimientos registrados aún.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 text-[11px] uppercase">
                        <th className="py-2.5 px-3">Fecha</th>
                        <th className="py-2.5 px-3">Producto</th>
                        <th className="py-2.5 px-3">Tipo de Movimiento</th>
                        <th className="py-2.5 px-3 text-center">Cantidad</th>
                        <th className="py-2.5 px-3">Motivo / Detalle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      {movements.map((mov) => {
                        const isEntry = mov.movement_type === "in";

                        return (
                          <tr key={mov.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40">
                            <td className="py-2.5 px-3 whitespace-nowrap text-neutral-500 font-mono text-[11px]">
                              {formatChileanDate(mov.created_at)} {formatChileanTime(mov.created_at)}
                            </td>
                            <td className="py-2.5 px-3 font-semibold">
                              {mov.inventory_items?.name || "Producto"}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <Badge
                                variant={
                                  isEntry
                                    ? "success"
                                    : mov.movement_type === "consumed_in_service"
                                    ? "warning"
                                    : "secondary"
                                }
                                className="text-[10px]"
                              >
                                {MOVEMENT_LABELS[mov.movement_type] || mov.movement_type}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold">
                              <span className={isEntry ? "text-emerald-600" : "text-neutral-700 dark:text-neutral-300"}>
                                {isEntry ? `+${mov.quantity}` : `-${mov.quantity}`}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-neutral-500 max-w-[200px] truncate">
                              {mov.reason || "-"}
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
      </Tabs>
    </div>
  );
}
