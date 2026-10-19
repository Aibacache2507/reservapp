import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresca la sesión si ha expirado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protección de rutas: las rutas de /dashboard y /admin requieren usuario autenticado
  const url = request.nextUrl.clone();
  const isDashboardRoute =
    url.pathname.startsWith("/admin") || url.pathname.startsWith("/dashboard");

  if (isDashboardRoute && !user) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
