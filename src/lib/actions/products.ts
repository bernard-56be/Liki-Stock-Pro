'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CreateProductInput {
  name: string
  quantity: number
  purchase_price: number
  sale_price: number
  min_price: number
  stock_alerte?: number
  category_id?: number
  image_url?: string
  qr_mode: 'none' | 'model' | 'unique'
  model_qr_code?: string
  unique_qr_codes?: string[]
}

export async function createProductWithQr(input: CreateProductInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Non connecté' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('boutique_id')
    .eq('id', user.id)
    .single()

  if (!profile?.boutique_id) {
    return { success: false, message: 'Aucune boutique associée' }
  }

  if (!input.name || input.name.trim().length === 0) {
    return { success: false, message: 'Le nom du produit est obligatoire.' }
  }

  if (input.min_price >= input.sale_price) {
    return { success: false, message: 'Le prix minimum doit être inférieur au prix de vente.' }
  }

  if (input.qr_mode === 'model' && !input.model_qr_code) {
    return { success: false, message: 'Un code QR modèle est requis.' }
  }

  if (input.qr_mode === 'unique') {
    if (!input.unique_qr_codes || input.unique_qr_codes.length === 0) {
      return { success: false, message: 'Au moins un code QR unique est requis.' }
    }
    if (input.unique_qr_codes.length !== input.quantity) {
      return { success: false, message: `Le nombre de QR (${input.unique_qr_codes.length}) doit correspondre à la quantité (${input.quantity}).` }
    }
  }

  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      boutique_id: profile.boutique_id,
      name: input.name.trim(),
      quantity: input.quantity,
      purchase_price: input.purchase_price,
      sale_price: input.sale_price,
      min_price: input.min_price,
      stock_alerte: input.stock_alerte ?? 5,
      category_id: input.category_id ?? null,
      image_url: input.image_url ?? null,
      qr_mode: input.qr_mode,
      model_qr_code: input.qr_mode === 'model' ? input.model_qr_code : null,
    })
    .select()
    .single()

  if (productError) {
    console.error('Erreur création produit:', productError)
    return { success: false, message: productError.message }
  }

  if (input.qr_mode === 'unique' && input.unique_qr_codes) {
    const qrRows = input.unique_qr_codes.map((code) => ({
      product_id: product.id,
      boutique_id: profile.boutique_id!,
      qr_code: code.trim(),
      status: 'IN_STOCK',
    }))

    const { error: qrError } = await supabase
      .from('product_qr_codes')
      .insert(qrRows)

    if (qrError) {
      await supabase.from('products').delete().eq('id', product.id)
      return { success: false, message: 'Erreur QR : ' + qrError.message }
    }
  }

  revalidatePath('/dashboard/owner/inventaire')
  return { success: true, message: 'Produit ajouté avec succès.', product }
}

export async function findProductByQr(qrCode: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Non connecté' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('boutique_id')
    .eq('id', user.id)
    .single()

  if (!profile?.boutique_id) return { success: false, message: 'Aucune boutique' }

  const { data: uniqueMatch } = await supabase
    .from('product_qr_codes')
    .select('*, product:products(*)')
    .eq('qr_code', qrCode.trim())
    .eq('boutique_id', profile.boutique_id)
    .eq('status', 'IN_STOCK')
    .maybeSingle()

  if (uniqueMatch) {
    return { success: true, product: uniqueMatch.product, qr_id: uniqueMatch.id, mode: 'unique' }
  }

  const { data: modelMatch } = await supabase
    .from('products')
    .select('*')
    .eq('model_qr_code', qrCode.trim())
    .eq('boutique_id', profile.boutique_id)
    .eq('qr_mode', 'model')
    .maybeSingle()

  if (modelMatch) {
    return { success: true, product: modelMatch, qr_id: null, mode: 'model' }
  }

  return { success: false, message: 'Aucun produit trouvé pour ce code QR.' }
}