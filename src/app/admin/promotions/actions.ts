"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveBusinessId } from "@/app/admin/settings/actions";
import type { DiscountType } from "@/types/database";

export interface PromoActionResult {
  success?: boolean;
  error?: string;
  message?: string;
}

export async function createCoupon(formData: FormData): Promise<PromoActionResult> {
  const supabase = await createClient();
  const businessId = await getActiveBusinessId();
  if (!businessId) return { error: "No autorizado." };

  const rawCode = (formData.get("code") as string)?.trim().toUpperCase();
  const discountType = (formData.get("discount_type") as DiscountType) || "percentage";
  const discountValue = parseFloat(formData.get("discount_value") as string);
  const maxUsesRaw = formData.get("max_uses") as string;
  const maxUses = maxUsesRaw ? parseInt(maxUsesRaw, 10) : null;
  const validFrom = formData.get("valid_from") as string || new Date().toISOString().split("T")[0];
  const validUntil = formData.get("valid_until") as string;

  if (!rawCode || isNaN(discountValue) || !validUntil) {
    return { error: "Por favor completa código, descuento y fecha de vencimiento." };
  }

  const { error } = await supabase.from("coupons").insert({
    business_id: businessId,
    code: rawCode,
    discount_type: discountType,
    discount_value: discountValue,
    max_uses: maxUses,
    uses_count: 0,
    valid_from: validFrom,
    valid_until: validUntil,
    is_active: true,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: `El código ${rawCode} ya existe en tu negocio.` };
    }
    return { error: error.message };
  }

  revalidatePath("/admin/promotions");
  return { success: true, message: `Cupón ${rawCode} creado exitosamente.` };
}

export async function deleteCoupon(couponId: string): Promise<PromoActionResult> {
  const supabase = await createClient();
  const businessId = await getActiveBusinessId();
  if (!businessId) return { error: "No autorizado." };

  const { error } = await supabase
    .from("coupons")
    .delete()
    .eq("id", couponId)
    .eq("business_id", businessId);

  if (error) return { error: error.message };

  revalidatePath("/admin/promotions");
  return { success: true, message: "Cupón eliminado." };
}

export async function createPack(formData: FormData): Promise<PromoActionResult> {
  const supabase = await createClient();
  const businessId = await getActiveBusinessId();
  if (!businessId) return { error: "No autorizado." };

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const totalSessions = parseInt(formData.get("total_sessions") as string, 10);
  const priceClp = parseInt(formData.get("price_clp") as string, 10);
  const validityDays = parseInt(formData.get("validity_days") as string, 10) || 90;

  if (!name || isNaN(totalSessions) || isNaN(priceClp)) {
    return { error: "Completa el nombre, sesiones y precio del pack." };
  }

  const { error } = await supabase.from("packs").insert({
    business_id: businessId,
    name,
    description,
    total_sessions: totalSessions,
    price_clp: priceClp,
    validity_days: validityDays,
    is_active: true,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/promotions");
  return { success: true, message: `Pack "${name}" creado exitosamente.` };
}

export async function deletePack(packId: string): Promise<PromoActionResult> {
  const supabase = await createClient();
  const businessId = await getActiveBusinessId();
  if (!businessId) return { error: "No autorizado." };

  const { error } = await supabase
    .from("packs")
    .delete()
    .eq("id", packId)
    .eq("business_id", businessId);

  if (error) return { error: error.message };

  revalidatePath("/admin/promotions");
  return { success: true, message: "Pack eliminado." };
}
