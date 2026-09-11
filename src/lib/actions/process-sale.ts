"use server";

import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/actions/services/notificationService";

export async function processSale(
  productId: string,
  quantity: number,
  unitPrice: number,
  currency: string = "USD",
  qrIds?: string[]
) {
  if (!productId || typeof productId !== "string") {
    return { success: false, message: "Produit invalide." };
  }
  if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
    return { success: false, message: "Quantité invalide." };
  }
  if (!unitPrice || unitPrice <= 0) {
    return { success: false, message: "Prix invalide." };
  }
  if (quantity > 1000) {
    return { success: false, message: "Quantité trop élevée. Maximum 1000 unités." };
  }

  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, message: "Vous devez être connecté." };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("boutique_id")
      .eq("id", user.id)
      .single();

    if (!profile?.boutique_id) {
      return { success: false, message: "Profil sans boutique associée." };
    }

    const { data: boutique } = await supabase
      .from("boutiques")
      .select("exchange_rate")
      .eq("id", profile.boutique_id)
      .single();

    const rate = boutique?.exchange_rate || 2850;

    const { data, error } = await supabase.rpc("process_sale", {
      p_product_id: productId,
      p_quantity: quantity,
      p_unit_price: unitPrice,
      p_exchange_rate: rate,
      p_currency: currency,
      p_qr_ids: qrIds || null,
    });

    if (error) {
      console.error("Erreur process_sale:", error);
      return { success: false, message: "Erreur serveur lors de la vente." };
    }

    if (data.success) {
      const newStock = data.new_stock;

      const { data: product } = await supabase
        .from("products")
        .select("name, stock_alerte, boutique_id")
        .eq("id", productId)
        .single();

      if (product && newStock <= product.stock_alerte) {
        const { data: owner } = await supabase
          .from("boutiques")
          .select("owner_id")
          .eq("id", product.boutique_id)
          .single();

        if (owner?.owner_id) {
          try {
            await createNotification(
              owner.owner_id,
              "Stock critique",
              `Le produit "${product.name}" est presque en rupture. Stock restant : ${newStock} unité(s).`,
              "danger"
            );
          } catch (notifError) {
            console.error("Échec notification:", notifError);
          }
        }
      }
    }

    return data;
  } catch (err) {
    console.error("Exception process_sale:", err);
    return { success: false, message: "Erreur inattendue." };
  }
}