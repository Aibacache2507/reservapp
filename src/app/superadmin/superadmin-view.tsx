"use client";

import * as React from "react";
import { updateBusinessStatus, updateBusinessPlan } from "./actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, ExternalLink, Power, Sparkles, Check, AlertTriangle } from "lucide-react";
import type { BusinessStatus } from "@/types/database";

interface SuperadminViewProps {
  businesses: any[];
}

export function SuperadminView({ businesses: initialBusinesses }: SuperadminViewProps) {
  const [businesses, setBusinesses] = React.useState(initialBusinesses);
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  const total = businesses.length;
  const activeCount = businesses.filter((b) => b.status === "active").length;
  const suspendedCount = businesses.filter((b) => b.status === "suspended").length;

  const handleToggleStatus = async (biz: any) => {
    const newStatus: BusinessStatus = biz.status === "active" ? "suspended" : "active";
    setLoadingId(biz.id);
    try {
      await updateBusinessStatus(biz.id, newStatus);
      setBusinesses((prev) =>
        prev.map((b) => (b.id === biz.id ? { ...b, status: newStatus } : b))
      );
    } catch (err: any) {
      alert(`Error al actualizar estado: ${err.message}`);
    } finally {
      setLoadingId(null);
    }
  };

  const handleChangePlan = async (biz: any, newPlan: string) => {
    setLoadingId(biz.id);
    try {
      await updateBusinessPlan(biz.id, newPlan);
      setBusinesses((prev) =>
        prev.map((b) => (b.id === biz.id ? { ...b, plan: newPlan } : b))
      );
    } catch (err: any) {
      alert(`Error al actualizar plan: ${err.message}`);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tarjetas de Métricas Globales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-neutral-950 border-neutral-800 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase font-mono text-neutral-400">
              Total Negocios Registrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold text-pink-500">{total}</p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-950 border-neutral-800 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase font-mono text-neutral-400">
              Negocios Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold text-emerald-400">{activeCount}</p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-950 border-neutral-800 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase font-mono text-neutral-400">
              Negocios Suspendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold text-amber-500">{suspendedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Negocios */}
      <Card className="bg-neutral-950 border-neutral-800 text-white">
        <CardHeader>
          <CardTitle className="text-lg">Todos los Negocios Registrados</CardTitle>
          <CardDescription className="text-neutral-400">
            Control de suscripción, plan y activación para la plataforma SaaS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-800 text-xs uppercase text-neutral-400 font-mono">
                <tr>
                  <th className="py-3 px-4">Negocio</th>
                  <th className="py-3 px-4">Slug / Web</th>
                  <th className="py-3 px-4">Rubro & Ciudad</th>
                  <th className="py-3 px-4">Plan SaaS</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {businesses.map((biz) => {
                  const isActive = biz.status === "active";
                  const isLoading = loadingId === biz.id;

                  return (
                    <tr key={biz.id} className="hover:bg-neutral-900/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: biz.brand_color || "#ec4899" }}
                          >
                            {biz.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{biz.name}</p>
                            <p className="text-xs text-neutral-400">{biz.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs">
                        <a
                          href={`/${biz.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-pink-400 hover:underline"
                        >
                          /{biz.slug}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-neutral-300">
                        <p className="capitalize">{biz.rubro.replace(/_/g, " ")}</p>
                        <p className="text-neutral-500">{biz.city || "Chile"}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={biz.plan || "pro"}
                          onChange={(e) => handleChangePlan(biz, e.target.value)}
                          disabled={isLoading}
                          className="bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs rounded px-2 py-1 focus:ring-1 focus:ring-pink-500"
                        >
                          <option value="starter">Starter</option>
                          <option value="pro">Pro ($29.990 CLP)</option>
                          <option value="enterprise">Enterprise ($59.990 CLP)</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant={isActive ? "success" : "warning"}
                          className="text-xs uppercase font-mono"
                        >
                          {biz.status}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-2">
                        <Button
                          variant={isActive ? "outline" : "default"}
                          size="sm"
                          isLoading={isLoading}
                          onClick={() => handleToggleStatus(biz)}
                          className={
                            isActive
                              ? "border-amber-600/40 text-amber-400 hover:bg-amber-950/40 text-xs"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                          }
                        >
                          <Power className="w-3.5 h-3.5 mr-1" />
                          {isActive ? "Suspender" : "Activar"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
