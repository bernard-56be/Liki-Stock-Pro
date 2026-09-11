'use client'

import { useEffect, useState } from 'react'
import { X, QrCode, Package, CheckCircle, XCircle } from 'lucide-react'
import { getProductQrDetails, type QrDetail } from '@/lib/actions/inventory-summary'
import type { Product } from '@/lib/actions/inventory'

interface Props {
  product: Product | null
  onClose: () => void
  exchangeRate: number
}

export default function ProductDetailModal({ product, onClose, exchangeRate }: Props) {
  const [qrs, setQrs] = useState<QrDetail[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!product || product.qrMode !== 'unique') return
    setLoading(true)
    getProductQrDetails(product.id)
      .then((res) => setQrs(res.data || []))
      .finally(() => setLoading(false))
  }, [product])

  if (!product) return null

  const formatPrice = (value: number, currency: string) => {
    if (currency === 'USD') return `${value.toFixed(2)} $`
    return `${Math.round(value).toLocaleString('fr-FR')} FC`
  }

  const totalValueUSD = product.quantity * product.salePrice
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

  const handlePrint = () => {
    if (!product || qrs.length === 0) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const qrHtml = qrs
      .map(
        (qr) => `
          <div style="page-break-inside: avoid; display: inline-block; margin: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 8px; text-align: center;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
              qr.qr_code
            )}" alt="${qr.qr_code}" />
            <p style="font-family: monospace; font-size: 11px; margin-top: 5px;">${qr.qr_code}</p>
            <p style="font-size: 11px; color: #555; margin: 2px 0 0 0;">${product.name}</p>
          </div>
        `
      )
      .join('')

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Codes - ${product.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { font-size: 18px; margin-bottom: 20px; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <h1>QR Codes - ${product.name} (${qrs.length})</h1>
          <button onclick="window.print()" style="margin-bottom: 20px; padding: 10px 20px; background: #4F46E5; color: white; border: none; border-radius: 8px; cursor: pointer;">
            🖨️ Imprimer
          </button>
          <div>${qrHtml}</div>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{product.name}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Mode :{' '}
              {product.qrMode === 'none'
                ? 'Sans QR'
                : product.qrMode === 'model'
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
              {formatPrice(product.purchasePrice, product.currency)}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500 uppercase font-semibold">Prix de vente</p>
            <p className="text-sm font-medium text-gray-700 mt-1">
              {formatPrice(product.salePrice, product.currency)}
            </p>
          </div>
        </div>

        {product.qrMode === 'unique' && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                Codes QR ({qrs.length})
              </h3>
              {qrs.length > 0 && (
                <button
                  onClick={handlePrint}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                >
                  🖨️ Imprimer les QR
                </button>
              )}
            </div>
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
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(
                          qr.qr_code
                        )}`}
                        alt={qr.qr_code}
                        width={48}
                        height={48}
                        className="rounded border border-gray-200"
                      />
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