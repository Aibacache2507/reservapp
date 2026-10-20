"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeChileanPhone } from "@/lib/utils/chile";

export interface AuthState {
  error?: string;
  success?: string;
}

/**
 * Registro de nuevos usuarios (dueños de negocio o profesionales)
 */
export async function signUpWithEmail(
  prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const fullName = (formData.get("full_name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();

  if (!email || !password || !fullName) {
    return { error: "Por favor completa todos los campos requeridos." };
  }

  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }

  const normalizedPhone = phone ? normalizeChileanPhone(phone) : null;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone: normalizedPhone,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    // Upsert perfil inicial
    await supabase.from("profiles").upsert({
      id: data.user.id,
      full_name: fullName,
      email,
      phone: normalizedPhone,
      is_superadmin: false,
    });
  }

  // Si requiere confirmación por correo:
  if (data.session === null) {
    return {
      success:
        "¡Registro casi listo! Te hemos enviado un correo de confirmación a tu email.",
    };
  }

  // Si inició sesión inmediatamente:
  redirect("/admin/onboarding");
}

/**
 * Inicio de sesión con correo y contraseña
 */
export async function signInWithEmail(
  prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Ingresa tu correo y contraseña." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error:
        "Credenciales inválidas. Revisa tu correo y contraseña.",
    };
  }

  // Comprobar si el usuario ya tiene un negocio registrado
  const { data: member } = await supabase
    .from("business_members")
    .select("business_id, role")
    .eq("user_id", data.user.id)
    .eq("is_active", true)
    .limit(1)
    .single();

  if (!member) {
    // Si no tiene negocio asociado, enviarlo a onboarding
    redirect("/admin/onboarding");
  }

  redirect("/admin/settings");
}

/**
 * Iniciar sesión con Google OAuth
 */
export async function signInWithGoogle() {
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    return redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  if (data.url) {
    return redirect(data.url);
  }
}

/**
 * Recuperación de contraseña
 */
export async function resetPassword(
  prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email) {
    return { error: "Por favor ingresa tu correo electrónico." };
  }

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/admin/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return {
    success:
      "Te hemos enviado las instrucciones de recuperación a tu correo electrónico.",
  };
}

/**
 * Cerrar sesión
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
