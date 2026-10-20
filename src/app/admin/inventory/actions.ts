"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface InventoryActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Crea un nuevo producto de inventario.
 */
export async function createInventoryItem(formData: FormData): Promise<InventoryActionResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "No autorizado." };
    }

    const businessId = formData.get("business_id") as string;
    const name = (formData.get("name") as string)?.trim();
    const sku = (formData.get("sku") as string)?.trim() || null;
    const description = (formData.get("description") as string)?.trim() || null;
    const currentStock = parseFloat(formData.get("current_stock") as string) || 0;
    const minStockAlert = parseFloat(formData.get("min_stock_alert") as string) || 5;
    const unitCostClp = parseInt(formData.get("unit_cost_clp") as string, 10) || 0;

    if (!businessId || !name) {
      return { success: false, error: "El nombre del producto es obligatorio." };
    }

    const { data: item, error } = await supabase
      .from("inventory_items")
      .insert({
        business_id: businessId,
        name,
        sku,
        description,
        current_stock: currentStock,
        min_stock_alert: minStockAlert,
        unit_cost_clp: unitCostClp,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error al crear producto de inventario:", error);
      return { success: false, error: "No se pudo guardar el producto." };
    }

    // Si empezó con stock inicial > 0, registrar movimiento de entrada inicial
    if (currentStock > 0 && item) {
      await supabase.from("inventory_movements").insert({
        business_id: businessId,
        item_id: item.id,
        movement_type: "in",
        quantity: currentStock,
        unit_cost_clp: unitCostClp,
        reason: "Inventario inicial al crear producto",
        performed_by: user.id,
      });
    }

    revalidatePath("/admin/inventory");
    return { success: true, message: `Producto "${name}" agregado al inventario.` };
  } catch (err: any) {
    console.error("Excepción en createInventoryItem:", err);
    return { success: false, error: err.message || "Error al procesar la solicitud." };
  }
}

/**
 * Registra un movimiento de inventario (entrada, salida, consumo en servicio o ajuste)
 * y descuenta/suma el stock en la tabla inventory_items.
 */
export async function recordInventoryMovement(formData: FormData): Promise<InventoryActionResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "No autorizado." };
    }

    const businessId = formData.get("business_id") as string;
    const itemId = formData.get("item_id") as string;
    const movementType = formData.get("movement_type") as "in" | "out" | "adjustment" | "consumed_in_service";
    const quantity = parseFloat(formData.get("quantity") as string);
    const reason = (formData.get("reason") as string)?.trim() || null;

    if (!businessId || !itemId || !movementType || !quantity || quantity <= 0) {
      return { success: false, error: "Por favor ingresa una cantidad válida mayor a 0." };
    }

    // 1. Obtener producto actual
    const { data: item, error: itemErr }: any = await supabase
      .from("inventory_items")
      .select("id, name, current_stock, unit_cost_clp")
      .eq("id", itemId)
      .eq("business_id", businessId)
      .single();

    if (itemErr || !item) {
      return { success: false, error: "Producto no encontrado." };
    }

    const currentStock = parseFloat(item.current_stock) || 0;
    let newStock = currentStock;

    if (movementType === "in") {
      newStock = currentStock + quantity;
    } else if (movementType === "out" || movementType === "consumed_in_service") {
      if (currentStock < quantity) {
        return {
          success: false,
          error: `Stock insuficiente. Stock actual: ${currentStock}, cantidad solicitada: ${quantity}.`,
        };
      }
      newStock = currentStock - quantity;
    } else if (movementType === "adjustment") {
      newStock = quantity; // En ajuste se define el stock real contado
    }

    // 2. Registrar movimiento
    const { error: movErr } = await supabase.from("inventory_movements").insert({
      business_id: businessId,
      item_id: itemId,
      movement_type: movementType,
      quantity,
      unit_cost_clp: item.unit_cost_clp || 0,
      reason: reason || `Movimiento de tipo ${movementType}`,
      performed_by: user.id,
    });

    if (movErr) {
      console.error("Error al registrar movimiento:", movErr);
      return { success: false, error: "Error al registrar el movimiento en el historial." };
    }

    // 3. Actualizar stock actual en el producto
    const { error: updErr } = await supabase
      .from("inventory_items")
      .update({
        current_stock: newStock,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId);

    if (updErr) {
      console.error("Error al actualizar stock de producto:", updErr);
      return { success: false, error: "No se pudo actualizar el stock del producto." };
    }

    revalidatePath("/admin/inventory");
    return {
      success: true,
      message: `Movimiento registrado con éxito. Nuevo stock de ${item.name}: ${newStock}.`,
    };
  } catch (err: any) {
    console.error("Excepción en recordInventoryMovement:", err);
    return { success: false, error: err.message || "Error al procesar el movimiento." };
  }
}

/**
 * Elimina un producto del inventario.
 */
export async function deleteInventoryItem(itemId: string): Promise<InventoryActionResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "No autorizado." };

    const { error } = await supabase.from("inventory_items").delete().eq("id", itemId);
    if (error) {
      return { success: false, error: "No se pudo eliminar el producto." };
    }

    revalidatePath("/admin/inventory");
    return { success: true, message: "Producto eliminado del inventario." };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
