import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin/settings";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Sincronizar perfil
      const userMeta = data.user.user_metadata || {};
      const fullName =
        userMeta.full_name ||
        userMeta.name ||
        data.user.email?.split("@")[0] ||
        "Usuario";

      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: fullName,
        email: data.user.email!,
        avatar_url: userMeta.avatar_url || userMeta.picture || null,
        phone: userMeta.phone || null,
        is_superadmin: false,
      });

      // Verificar si ya tiene negocio
      const { data: member } = await supabase
        .from("business_members")
        .select("business_id")
        .eq("user_id", data.user.id)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (!member) {
        return NextResponse.redirect(`${origin}/admin/onboarding`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Si ocurre un error, regresar a login con mensaje
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
