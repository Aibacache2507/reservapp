"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveBusinessId } from "@/app/admin/settings/actions";
import { normalizeChileanPhone } from "@/lib/utils/chile";

export interface ClientActionResult {
  success?: boolean;
  error?: string;
  message?: string;
}

/**
 * Guarda o actualiza la ficha técnica confidencial del cliente
 */
export async function saveClientRecord(
  formData: FormData
): Promise<ClientActionResult> {
  const supabase = await createClient();
  const businessId = await getActiveBusinessId();
  if (!businessId) return { error: "No autorizado." };

  const clientId = formData.get("client_id") as string;
  const notes = (formData.get("notes") as string)?.trim() || "";
  const allergies = (formData.get("allergies") as string)?.trim() || null;
  const preferences = (formData.get("preferences") as string)?.trim() || null;

  if (!clientId) return { error: "ID de cliente no provisto." };

  // Buscar si ya existe una ficha para este cliente
  const { data: existing }: any = await supabase
    .from("client_records")
    .select("id")
    .eq("business_id", businessId)
    .eq("client_id", clientId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("client_records")
      .update({
        notes,
        allergies,
        preferences,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("client_records").insert({
      business_id: businessId,
      client_id: clientId,
      notes,
      allergies,
      preferences,
    });

    if (error) return { error: error.message };
  }

  revalidatePath("/admin/clients");
  return { success: true, message: "Ficha técnica actualizada correctamente." };
}

/**
 * Actualiza los datos de contacto y notas generales del cliente
 */
export async function updateClientContact(
  formData: FormData
): Promise<ClientActionResult> {
  const supabase = await createClient();
  const businessId = await getActiveBusinessId();
  if (!businessId) return { error: "No autorizado." };

  const clientId = formData.get("client_id") as string;
  const fullName = (formData.get("full_name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!clientId || !fullName) {
    return { error: "El nombre es obligatorio." };
  }

  const { error } = await supabase
    .from("clients")
    .update({
      full_name: fullName,
      phone: phone ? normalizeChileanPhone(phone) : "",
      email: email || "",
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clientId)
    .eq("business_id", businessId);

  if (error) return { error: error.message };

  revalidatePath("/admin/clients");
  return { success: true, message: "Datos del cliente actualizados." };
}
