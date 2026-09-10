'use server'

import { createClient } from '@/lib/supabase/server'

export interface InventoryGroupedItem {
  product_id: string
  name: string
  qr_mode: 'none' | 'model' | 'unique'
  quantity: number
  stock_alerte: number
  currency: string
  purchase_price: number
  sale_price: number
  min_price: number
  image_url: string | null
  total_qr_in_stock: number
  total_qr_sold: number
}

export interface QrDetail {
  id: string
  qr_code: string
  status: 'IN_STOCK' | 'SOLD' | 'CANCELLED'
  created_at: string
  sold_at: string | null
}

export async function getInventorySummary() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non connecté')

  const { data: profile } = await supabase
    .from('profiles')
    .select('boutique_id')
    .eq('id', user.id)
    .single()

  if (!profile?.boutique_id) throw new Error('Aucune boutique associée')

  const { data: boutique } = await supabase
    .from('boutiques')
    .select('exchange_rate')
    .eq('id', profile.boutique_id)
    .single()

  const exchangeRate = Number(boutique?.exchange_rate) || 2850

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('boutique_id', profile.boutique_id)
    .order('name')

  if (error) throw new Error(error.message)

  const enriched: InventoryGroupedItem[] = []

  for (const p of products || []) {
    let total_qr_in_stock = 0
    let total_qr_sold = 0

    if (p.qr_mode === 'unique') {
      const { data: qrs } = await supabase
        .from('product_qr_codes')
        .select('status')
        .eq('product_id', p.id)

      total_qr_in_stock = qrs?.filter(q => q.status === 'IN_STOCK').length || 0
      total_qr_sold = qrs?.filter(q => q.status === 'SOLD').length || 0
    }

    enriched.push({
      product_id: p.id,
      name: p.name,
      qr_mode: p.qr_mode || 'none',
      quantity: p.quantity,
      stock_alerte: p.stock_alerte,
      currency: p.currency || 'USD',
      purchase_price: p.purchase_price,
      sale_price: p.sale_price,
      min_price: p.min_price,
      image_url: p.image_url,
      total_qr_in_stock,
      total_qr_sold,
    })
  }

  return { success: true, data: enriched, exchangeRate }
}

export async function getProductQrDetails(productId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non connecté')

  const { data: qrs, error } = await supabase
    .from('product_qr_codes')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return { success: true, data: qrs as QrDetail[] }
}