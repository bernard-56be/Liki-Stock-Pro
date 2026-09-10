'use client'

import { useEffect, useState } from 'react'
import { X, QrCode, Package, CheckCircle, XCircle } from 'lucide-react'
import { getProductQrDetails, type QrDetail, type InventoryGroupedItem } from '@/lib/actions/inventory-summary'

interface Props {
  product: InventoryGroupedItem | null
  onClose: () => void
  exchangeRate: number
}

export default function ProductDetailModal({ product, onClose, exchangeRate }: Props) {
  const [qrs, setQrs] = useState<QrDetail[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!product || product.qr_mode !== 'unique') return
    setLoading(true)
    getProductQrDetails(product.product_id)
      .then((res) => setQrs(res.data || []))
      .finally(() => setLoading(false))
  }, [product])

  if (!product) return null

  const formatPrice = (value: number, currency: string) => {
    if (currency === 'USD') return `${value.toFixed(2)} $`
    return `${Math.round(value).toLocaleString('fr-FR')} FC`
  }

  const totalValueUSD = product.quantity * product.sale_price
  const totalValueCDF = totalValueUSD * exchangeRate

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_STOCK':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
            <CheckCircle className="h-3 w-3" />En stock
          </span>
        )
      case 'SOLD':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
            <Package className="h-3 w-3" />Vendu
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
            <XCircle className="h-3 w-3" />Annulé
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{product.name}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Mode :{' '}
              {product.qr_mode === 'none'
                ? 'Sans QR'
                : product.qr_mode === 'model'
                ? 'QR Modèle'
                : 'QR Unique'}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 p-5 border-b border-gray-100">
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500 uppercase font-semibold">Quantité</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{product.quantity}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500 uppercase font-semibold">Valeur totale</p>
            <p className="text-sm font-bold text-gray-900 mt-1">
              {formatPrice(totalValueUSD, 'USD')}
            </p>
            <p className="text-xs text-gray-500">≈ {formatPrice(totalValueCDF, 'CDF')}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500 uppercase font-semibold">Prix d&apos;achat</p>
            <p className="text-sm font-medium text-gray-700 mt-1">
              {formatPrice(product.purchase_price, product.currency)}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500 uppercase font-semibold">Prix de vente</p>
            <p className="text-sm font-medium text-gray-700 mt-1">
              {formatPrice(product.sale_price, product.currency)}
            </p>
          </div>
        </div>

        {product.qr_mode === 'unique' && (
          <div className="p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              Codes QR ({qrs.length})
            </h3>
            {loading ? (
              <p className="text-sm text-gray-500">Chargement...</p>
            ) : qrs.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun QR enregistré.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {qrs.map((qr) => (
                  <div
                    key={qr.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-mono text-gray-700">{qr.qr_code}</span>
                    </div>
                    {getStatusBadge(qr.status)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}