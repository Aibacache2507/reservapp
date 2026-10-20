"use client";

import * as React from "react";
import { formatCLP } from "@/lib/utils/chile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Calendar,
  TrendingUp,
  Users,
  Scissors,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  ArrowUpRight,
} from "lucide-react";

interface AppointmentData {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  total_price_clp: number;
  service_id?: string;
  professional_id?: string;
  services?: { name: string };
  professionals?: { name: string; commission_percentage?: number };
}

interface DashboardViewProps {
  business: any;
  appointments: AppointmentData[];
}

export function DashboardView({ business, appointments }: DashboardViewProps) {
  const [period, setPeriod] = React.useState<"today" | "week" | "month" | "year">("month");

  // Filtrar citas según período seleccionado
  const filteredAppointments = React.useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    return appointments.filter((apt) => {
      const aptDate = new Date(apt.starts_at);
      const aptDateStr = aptDate.toISOString().split("T")[0];

      if (period === "today") {
        return aptDateStr === todayStr;
      }

      if (period === "week") {
        const oneWeekAgo = new Date(now.getTime() - 7 * 86400000);
        return aptDate >= oneWeekAgo && aptDate <= now;
      }

      if (period === "month") {
        return (
          aptDate.getMonth() === now.getMonth() &&
          aptDate.getFullYear() === now.getFullYear()
        );
      }

      if (period === "year") {
        return aptDate.getFullYear() === now.getFullYear();
      }

      return true;
    });
  }, [appointments, period]);

  // Cálculos de KPIs
  const completedApts = filteredAppointments.filter((a) => a.status === "completed");
  const totalRevenue = completedApts.reduce((sum, a) => sum + (Number(a.total_price_clp) || 0), 0);
  const totalAptsCount = filteredAppointments.length;

  const cancelledCount = filteredAppointments.filter((a) => a.status === "cancelled").length;
  const noShowCount = filteredAppointments.filter((a) => a.status === "no_show").length;
  const confirmedCount = filteredAppointments.filter((a) => a.status === "confirmed").length;

  // Tasas
  const cancellationRate = totalAptsCount > 0 ? Math.round((cancelledCount / totalAptsCount) * 100) : 0;
  const noShowRate = totalAptsCount > 0 ? Math.round((noShowCount / totalAptsCount) * 100) : 0;
  const attendanceRate = totalAptsCount > 0 ? Math.round((completedApts.length / totalAptsCount) * 100) : 0;

  // Ticket promedio
  const averageTicket = completedApts.length > 0 ? Math.round(totalRevenue / completedApts.length) : 0;

  // Ranking de Servicios
  const serviceStats = React.useMemo(() => {
    const map = new Map<string, { name: string; count: number; revenue: number }>();
    for (const apt of completedApts) {
      const srvName = apt.services?.name || "Servicio General";
      const existing = map.get(srvName) || { name: srvName, count: 0, revenue: 0 };
      existing.count += 1;
      existing.revenue += Number(apt.total_price_clp) || 0;
      map.set(srvName, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [completedApts]);

  // Ranking de Profesionales
  const professionalStats = React.useMemo(() => {
    const map = new Map<
      string,
      { name: string; count: number; revenue: number; commission: number }
    >();
    for (const apt of completedApts) {
      const profName = apt.professionals?.name || "Sin Asignar";
      const commPct = Number(apt.professionals?.commission_percentage) || 0;
      const price = Number(apt.total_price_clp) || 0;
      const commAmount = Math.round((price * commPct) / 100);

      const existing = map.get(profName) || {
        name: profName,
        count: 0,
        revenue: 0,
        commission: 0,
      };
      existing.count += 1;
      existing.revenue += price;
      existing.commission += commAmount;
      map.set(profName, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [completedApts]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Encabezado y Filtro de Período */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Dashboard y Rendimiento Financiero
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Resumen en tiempo real de ingresos en CLP, volumen de citas, tasas de ocupación y rankings
          </p>
        </div>

        {/* Selector de Período */}
        <div className="flex items-center gap-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-1 rounded-xl shadow-xs self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setPeriod("today")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              period === "today"
                ? "bg-pink-600 text-white shadow-xs"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
            }`}
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => setPeriod("week")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              period === "week"
                ? "bg-pink-600 text-white shadow-xs"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
            }`}
          >
            Últimos 7 Días
          </button>
          <button
            type="button"
            onClick={() => setPeriod("month")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              period === "month"
                ? "bg-pink-600 text-white shadow-xs"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
            }`}
          >
            Este Mes
          </button>
          <button
            type="button"
            onClick={() => setPeriod("year")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              period === "year"
                ? "bg-pink-600 text-white shadow-xs"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
            }`}
          >
            Este Año
          </button>
        </div>
      </div>

      {/* 4 KPIs Clave */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Ingresos Totales */}
        <Card className="border-pink-200 bg-linear-to-br from-pink-50/50 to-white dark:from-pink-950/20 dark:to-neutral-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Ingresos Facturados
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center text-pink-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">
              {formatCLP(totalRevenue)}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>{completedApts.length} citas cobradas en el local</span>
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Total de Citas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Citas del Período
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600">
              <Calendar className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">
              {totalAptsCount}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-1">
              <span className="text-emerald-600 font-semibold">{completedApts.length} ok</span>
              <span>•</span>
              <span className="text-red-500">{cancelledCount} canceladas</span>
              <span>•</span>
              <span className="text-neutral-400">{noShowCount} no show</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Ticket Promedio */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Ticket Promedio
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">
              {formatCLP(averageTicket)}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              Gasto promedio por cita completada
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Tasa de Ocupación / Cumplimiento */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Tasa de Asistencia
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-emerald-600">
              {attendanceRate}%
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              Cancelación: {cancellationRate}% | No asistió: {noShowRate}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grilla con Rankings: Servicios y Profesionales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking de Servicios */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Scissors className="w-4 h-4 text-pink-600" />
              Servicios Más Demandados
            </CardTitle>
            <CardDescription className="text-xs">
              Servicios con mayor número de sesiones realizadas y facturación
            </CardDescription>
          </CardHeader>
          <CardContent>
            {serviceStats.length === 0 ? (
              <p className="py-8 text-center text-xs text-neutral-400">
                No hay datos de servicios completados en este período.
              </p>
            ) : (
              <div className="space-y-3">
                {serviceStats.map((srv, idx) => {
                  const maxRevenue = serviceStats[0]?.revenue || 1;
                  const pct = Math.round((srv.revenue / maxRevenue) * 100);

                  return (
                    <div key={srv.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="truncate pr-2 flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[10px] flex items-center justify-center font-bold text-neutral-600">
                            {idx + 1}
                          </span>
                          <span className="font-semibold">{srv.name}</span>
                        </span>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-neutral-500 text-[11px]">{srv.count} citas</span>
                          <span className="font-bold text-neutral-900 dark:text-neutral-100">
                            {formatCLP(srv.revenue)}
                          </span>
                        </div>
                      </div>

                      {/* Barra de Progreso */}
                      <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-pink-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ranking de Profesionales */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Rendimiento del Equipo
            </CardTitle>
            <CardDescription className="text-xs">
              Facturación generada y comisiones acumuladas por estilista
            </CardDescription>
          </CardHeader>
          <CardContent>
            {professionalStats.length === 0 ? (
              <p className="py-8 text-center text-xs text-neutral-400">
                No hay datos de atención en este período.
              </p>
            ) : (
              <div className="space-y-3">
                {professionalStats.map((prof, idx) => (
                  <div
                    key={prof.name}
                    className="p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/50 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-7 h-7 rounded-lg bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 font-bold flex items-center justify-center shrink-0">
                        {prof.name.slice(0, 1)}
                      </div>
                      <div className="truncate">
                        <p className="font-bold truncate">{prof.name}</p>
                        <p className="text-[11px] text-neutral-500">{prof.count} citas atendidas</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-neutral-900 dark:text-neutral-100">
                        {formatCLP(prof.revenue)}
                      </p>
                      <p className="text-[10px] text-purple-600 font-semibold">
                        Comisión: {formatCLP(prof.commission)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
