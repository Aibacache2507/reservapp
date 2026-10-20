"use client";

import * as React from "react";
import { formatCLP } from "@/lib/utils/chile";
import { formatChileanDate, formatChileanTime } from "@/lib/utils/dates";
import { generateCSV } from "@/lib/utils/export";
import {
  markCommissionPaid,
  markAllProfessionalCommissionsPaid,
  type CommissionActionResult,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Download,
  CheckCircle2,
  Clock,
  User,
  Scissors,
  Check,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";

interface CommissionRecord {
  id: string;
  business_id: string;
  professional_id: string;
  appointment_id: string;
  commission_percentage: number;
  total_amount_clp: number;
  commission_amount_clp: number;
  status: "pending" | "paid";
  paid_at: string | null;
  created_at: string;
  professionals?: {
    name: string;
    commission_percentage?: number;
  };
  appointments?: {
    starts_at: string;
    clients?: {
      name: string;
      rut: string;
    };
    services?: {
      name: string;
    };
  };
}

interface CommissionsViewProps {
  business: any;
  commissions: CommissionRecord[];
  professionals: any[];
  userRole: "business_admin" | "professional";
  currentProfessionalId?: string;
}

export function CommissionsView({
  business,
  commissions: initialCommissions,
  professionals,
  userRole,
  currentProfessionalId,
}: CommissionsViewProps) {
  const [commissions, setCommissions] = React.useState(initialCommissions);
  const [selectedProf, setSelectedProf] = React.useState<string>(
    userRole === "professional" && currentProfessionalId ? currentProfessionalId : "all"
  );
  const [feedback, setFeedback] = React.useState<CommissionActionResult | null>(null);

  // Filtrar comisiones por profesional
  const filteredCommissions = React.useMemo(() => {
    if (selectedProf === "all") return commissions;
    return commissions.filter((c) => c.professional_id === selectedProf);
  }, [commissions, selectedProf]);

  // Cálculos
  const totalBilled = filteredCommissions.reduce((sum, c) => sum + (c.total_amount_clp || 0), 0);
  const totalCommissions = filteredCommissions.reduce((sum, c) => sum + (c.commission_amount_clp || 0), 0);
  const pendingCommissions = filteredCommissions
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + (c.commission_amount_clp || 0), 0);
  const paidCommissions = filteredCommissions
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + (c.commission_amount_clp || 0), 0);

  // Función de descarga CSV compatible con Excel
  const handleExportCSV = () => {
    const csvData = filteredCommissions.map((c) => ({
      fecha: formatChileanDate(c.appointments?.starts_at || c.created_at),
      hora: formatChileanTime(c.appointments?.starts_at || c.created_at),
      profesional: c.professionals?.name || "Sin nombre",
      cliente: c.appointments?.clients?.name || "Cliente",
      rut_cliente: c.appointments?.clients?.rut || "",
      servicio: c.appointments?.services?.name || "Servicio",
      total_cobrado_clp: c.total_amount_clp,
      porcentaje_comision: `${c.commission_percentage}%`,
      monto_comision_clp: c.commission_amount_clp,
      estado: c.status === "paid" ? "Pagada" : "Pendiente",
      fecha_pago: c.paid_at ? formatChileanDate(c.paid_at) : "",
    }));

    const csvContent = generateCSV(csvData, [
      { key: "fecha", header: "Fecha" },
      { key: "hora", header: "Hora" },
      { key: "profesional", header: "Profesional" },
      { key: "cliente", header: "Cliente" },
      { key: "rut_cliente", header: "RUT Cliente" },
      { key: "servicio", header: "Servicio" },
      { key: "total_cobrado_clp", header: "Total Cobrado (CLP)", format: (v) => formatCLP(v) },
      { key: "porcentaje_comision", header: "% Comisión" },
      { key: "monto_comision_clp", header: "Monto Comisión (CLP)", format: (v) => formatCLP(v) },
      { key: "estado", header: "Estado" },
      { key: "fecha_pago", header: "Fecha Pago" },
    ]);

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Liquidacion_Comisiones_${business.slug}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {userRole === "professional" ? "Mis Comisiones y Liquidaciones" : "Liquidación de Comisiones"}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Cálculo automático por cita completada según el porcentaje pactado con cada profesional
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {userRole === "business_admin" && (
            <select
              value={selectedProf}
              onChange={(e) => setSelectedProf(e.target.value)}
              className="flex h-9 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs font-medium"
            >
              <option value="all">Todo el Equipo ({professionals.length})</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.commission_percentage || 0}%)
                </option>
              ))}
            </select>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            className="text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Excel (CSV)</span>
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

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Total Facturado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">
              {formatCLP(totalBilled)}
            </p>
            <p className="text-[11px] text-neutral-400 mt-1">
              Recaudado en servicios completados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Comisiones Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-purple-600">
              {formatCLP(totalCommissions)}
            </p>
            <p className="text-[11px] text-neutral-400 mt-1">
              Monto generado para el equipo
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/20 dark:border-amber-900/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Pendiente de Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-amber-600">
              {formatCLP(pendingCommissions)}
            </p>
            <p className="text-[11px] text-neutral-500 mt-1">
              Por liquidar a profesionales
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/20 dark:border-emerald-900/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Pagadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-emerald-600">
              {formatCLP(paidCommissions)}
            </p>
            <p className="text-[11px] text-neutral-500 mt-1">
              Comisiones ya liquidadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Acción de liquidación masiva por profesional */}
      {userRole === "business_admin" && selectedProf !== "all" && pendingCommissions > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-4 rounded-xl flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
              Liquidar comisiones pendientes para este profesional
            </p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              Total acumulado pendiente: <strong>{formatCLP(pendingCommissions)}</strong>
            </p>
          </div>

          <form
            action={async (formData) => {
              const res = await markAllProfessionalCommissionsPaid(formData);
              setFeedback(res);
              if (res.success) {
                setCommissions((prev) =>
                  prev.map((c) =>
                    c.professional_id === selectedProf ? { ...c, status: "paid" } : c
                  )
                );
              }
            }}
          >
            <input type="hidden" name="business_id" value={business.id} />
            <input type="hidden" name="professional_id" value={selectedProf} />
            <Button size="sm" className="text-xs bg-amber-600 hover:bg-amber-700 text-white">
              <Check className="w-3.5 h-3.5 mr-1" />
              Marcar Todo como Pagado
            </Button>
          </form>
        </div>
      )}

      {/* Tabla Detallada de Comisiones */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-purple-600" />
            Detalle de Citas y Liquidaciones
          </CardTitle>
          <CardDescription className="text-xs">
            Registro transparente de cada servicio realizado y cálculo de comisión
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCommissions.length === 0 ? (
            <p className="py-8 text-center text-xs text-neutral-400">
              No hay registros de comisiones para los filtros seleccionados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 text-[11px] uppercase">
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">Profesional</th>
                    <th className="py-2.5 px-3">Cliente / Servicio</th>
                    <th className="py-2.5 px-3 text-right">Total Cobrado</th>
                    <th className="py-2.5 px-3 text-center">% Pactado</th>
                    <th className="py-2.5 px-3 text-right">Monto Comisión</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                    {userRole === "business_admin" && <th className="py-2.5 px-3 text-right">Acción</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredCommissions.map((comm) => (
                    <tr key={comm.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40">
                      <td className="py-2.5 px-3 whitespace-nowrap text-neutral-500 font-mono text-[11px]">
                        {formatChileanDate(comm.appointments?.starts_at || comm.created_at)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-semibold">
                        {comm.professionals?.name || "Profesional"}
                      </td>
                      <td className="py-2.5 px-3">
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">
                          {comm.appointments?.services?.name || "Servicio"}
                        </p>
                        <p className="text-[11px] text-neutral-400">
                          {comm.appointments?.clients?.name} ({comm.appointments?.clients?.rut || "S/RUT"})
                        </p>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium">
                        {formatCLP(comm.total_amount_clp)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-neutral-600">
                        {comm.commission_percentage}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-purple-600">
                        {formatCLP(comm.commission_amount_clp)}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <Badge
                          variant={comm.status === "paid" ? "success" : "warning"}
                          className="text-[10px]"
                        >
                          {comm.status === "paid" ? "Pagada" : "Pendiente"}
                        </Badge>
                      </td>
                      {userRole === "business_admin" && (
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          {comm.status === "pending" ? (
                            <form
                              action={async (formData) => {
                                const res = await markCommissionPaid(formData);
                                setFeedback(res);
                                if (res.success) {
                                  setCommissions((prev) =>
                                    prev.map((c) => (c.id === comm.id ? { ...c, status: "paid" } : c))
                                  );
                                }
                              }}
                            >
                              <input type="hidden" name="commission_id" value={comm.id} />
                              <Button size="sm" variant="ghost" className="text-xs h-7 px-2 text-emerald-600 hover:text-emerald-700">
                                <Check className="w-3.5 h-3.5 mr-1" />
                                Pagar
                              </Button>
                            </form>
                          ) : (
                            <span className="text-[11px] text-neutral-400">Pagada</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
