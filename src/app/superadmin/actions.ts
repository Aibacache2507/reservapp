"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { BusinessStatus } from "@/types/database";

export async function updateBusinessStatus(
  businessId: string,
  newStatus: BusinessStatus
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado.");
  }

  // Verificar si es superadmin
  const { data: profile }: any = await supabase
    .from("profiles")
    .select("is_superadmin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_superadmin) {
    throw new Error("Acceso denegado: solo superadministradores.");
  }

  const { error } = await supabase
    .from("businesses")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", businessId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/superadmin");
}

export async function updateBusinessPlan(businessId: string, plan: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado.");

  const { data: profile }: any = await supabase
    .from("profiles")
    .select("is_superadmin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_superadmin) throw new Error("Acceso denegado.");

  const { error } = await supabase
    .from("businesses")
    .update({
      plan,
      updated_at: new Date().toISOString(),
    })
    .eq("id", businessId);

  if (error) throw new Error(error.message);

  revalidatePath("/superadmin");
}
