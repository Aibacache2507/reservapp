import * as React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Shield, ArrowLeft, Building2 } from "lucide-react";

export default async function SuperadminLayout({
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

  // Comprobar rol de superadministrador
  const { data: profile }: any = await supabase
    .from("profiles")
    .select("is_superadmin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_superadmin) {
    // Si no es superadmin, redirigir a su panel normal
    redirect("/admin/settings");
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100">
      <header className="border-b border-neutral-800 bg-neutral-950 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              RESERVAPP <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-normal">Superadmin</span>
            </h1>
            <p className="text-xs text-neutral-400">
              Gestión centralizada de negocios y planes SaaS
            </p>
          </div>
        </div>

        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a mi negocio
        </Link>
      </header>

      <main className="p-6 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
