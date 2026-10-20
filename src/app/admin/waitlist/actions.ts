"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveBusinessId } from "@/app/admin/settings/actions";
import type { WaitlistStatus } from "@/types/database";

export interface WaitlistActionResult {
  success?: boolean;
  error?: string;
  message?: string;
}

export async function updateWaitlistStatus(
  waitlistId: string,
  newStatus: WaitlistStatus
): Promise<WaitlistActionResult> {
  const supabase = await createClient();
  const businessId = await getActiveBusinessId();
  if (!businessId) return { error: "No autorizado." };

  const { error } = await supabase
    .from("waitlist")
    .update({ status: newStatus })
    .eq("id", waitlistId)
    .eq("business_id", businessId);

  if (error) return { error: error.message };

  revalidatePath("/admin/waitlist");
  return { success: true, message: "Estado de lista de espera actualizado." };
}

export async function deleteWaitlistEntry(
  waitlistId: string
): Promise<WaitlistActionResult> {
  const supabase = await createClient();
  const businessId = await getActiveBusinessId();
  if (!businessId) return { error: "No autorizado." };

  const { error } = await supabase
    .from("waitlist")
    .delete()
    .eq("id", waitlistId)
    .eq("business_id", businessId);

  if (error) return { error: error.message };

  revalidatePath("/admin/waitlist");
  return { success: true, message: "Registro eliminado." };
}
