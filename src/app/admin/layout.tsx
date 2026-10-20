import * as React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import {
  Calendar,
  Settings,
  Users,
  ExternalLink,
  LogOut,
  Sparkles,
  Scissors,
  Clock,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Obtener negocio y rol del usuario
  const { data: member }: any = await supabase
    .from("business_members")
    .select("role, business_id, businesses(*)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!member || !member.businesses) {
    redirect("/admin/onboarding");
  }

  const business = member.businesses as any;
  const isSuperadmin = user.user_metadata?.is_superadmin || false;

  return (
    <div className="min-h-screen flex bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      {/* Sidebar de Navegación Lateral */}
      <aside className="w-64 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col shrink-0">
        {/* Brand / Logo */}
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800">
          <Link href="/admin/settings" className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: business.brand_color || "#ec4899" }}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold truncate max-w-[150px]">
                {business.name}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="success" className="text-[10px] px-1.5 py-0">
                  {business.plan?.toUpperCase() || "PRO"}
                </Badge>
                <span className="text-[11px] text-neutral-400 capitalize">
                  {member.role === "business_admin" ? "Administrador" : "Profesional"}
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Links de Navegación */}
        <nav className="flex-1 p-3 space-y-1 text-sm font-medium">
          <Link
            href="/admin/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 transition-colors"
          >
            <Settings className="w-4 h-4 text-pink-600" />
            <span>Configuración del Local</span>
          </Link>

          <Link
            href="/admin/settings?tab=services"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 transition-colors"
          >
            <Scissors className="w-4 h-4 text-neutral-500" />
            <span>Servicios y Precios</span>
          </Link>

          <Link
            href="/admin/settings?tab=team"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 transition-colors"
          >
            <Users className="w-4 h-4 text-neutral-500" />
            <span>Equipo y Profesionales</span>
          </Link>

          <Link
            href="/admin/settings?tab=schedules"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 transition-colors"
          >
            <Clock className="w-4 h-4 text-neutral-500" />
            <span>Horarios y Descansos</span>
          </Link>

          <Link
            href="/admin/settings?tab=rules"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 transition-colors"
          >
            <Calendar className="w-4 h-4 text-neutral-500" />
            <span>Reglas de Agendamiento</span>
          </Link>

          {isSuperadmin && (
            <Link
              href="/superadmin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
            >
              <Shield className="w-4 h-4" />
              <span>Panel Superadmin</span>
            </Link>
          )}

          {/* Enlace a la página pública del negocio */}
          <div className="pt-4 mt-4 border-t border-neutral-200 dark:border-neutral-800">
            <Link
              href={`/${business.slug}`}
              target="_blank"
              className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300 hover:bg-pink-100 transition-colors text-xs font-semibold"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5" />
                Ver página pública
              </span>
              <span className="text-[11px] opacity-75">/{business.slug}</span>
            </Link>
          </div>
        </nav>

        {/* Footer del usuario & Cerrar Sesión */}
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-xs font-semibold truncate text-neutral-800 dark:text-neutral-200">
              {user.user_metadata?.full_name || user.email}
            </p>
            <p className="text-[11px] text-neutral-400 truncate">{user.email}</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              title="Cerrar sesión"
              className="p-2 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
