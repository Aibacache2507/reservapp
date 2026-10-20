"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface CommissionActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Marca una comisión específica como pagada.
 */
export async function markCommissionPaid(formData: FormData): Promise<CommissionActionResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "No autorizado." };
    }

    const commissionId = formData.get("commission_id") as string;
    if (!commissionId) {
      return { success: false, error: "ID de comisión no especificado." };
    }

    const { error } = await supabase
      .from("commissions")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", commissionId);

    if (error) {
      console.error("Error al marcar comisión como pagada:", error);
      return { success: false, error: "No se pudo actualizar el estado de la comisión." };
    }

    revalidatePath("/admin/commissions");
    return { success: true, message: "Comisión marcada como pagada correctamente." };
  } catch (err: any) {
    console.error("Excepción en markCommissionPaid:", err);
    return { success: false, error: err.message || "Error al procesar la solicitud." };
  }
}

/**
 * Marca todas las comisiones pendientes de un profesional como pagadas.
 */
export async function markAllProfessionalCommissionsPaid(
  formData: FormData
): Promise<CommissionActionResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "No autorizado." };
    }

    const professionalId = formData.get("professional_id") as string;
    const businessId = formData.get("business_id") as string;

    if (!professionalId || !businessId) {
      return { success: false, error: "Datos de liquidación incompletos." };
    }

    const { error } = await supabase
      .from("commissions")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("business_id", businessId)
      .eq("professional_id", professionalId)
      .eq("status", "pending");

    if (error) {
      console.error("Error al liquidar comisiones del profesional:", error);
      return { success: false, error: "No se pudieron actualizar las comisiones." };
    }

    revalidatePath("/admin/commissions");
    return { success: true, message: "Todas las comisiones pendientes del profesional han sido pagadas." };
  } catch (err: any) {
    console.error("Excepción en markAllProfessionalCommissionsPaid:", err);
    return { success: false, error: err.message || "Error al procesar la liquidación." };
  }
}
