'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { X, Camera } from 'lucide-react'

interface Props {
  onScanSuccess: (decodedText: string) => void
  onClose: () => void
}

export default function QrScanner({ onScanSuccess, onClose }: Props) {
  const [isStarting, setIsStarting] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const isRunningRef = useRef(false)
  const isMountedRef = useRef(true)
  const elementId = 'qr-reader-container'

  useEffect(() => {
    isMountedRef.current = true
    const scanner = new Html5Qrcode(elementId)
    scannerRef.current = scanner

    const startScanner = async () => {
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            // Éviter les doubles scans
            if (!isRunningRef.current || !isMountedRef.current) return
            isRunningRef.current = false

            try {
              if (scanner.getState() === 2 /* SCANNING */) {
                await scanner.stop()
              }
              scanner.clear()
            } catch (e) {
              console.warn('Erreur lors de l\'arrêt après scan:', e)
            }

            if (isMountedRef.current) {
              onScanSuccess(decodedText)
            }
          },
          () => {
            // Erreurs de frame ignorées (pas de QR détecté)
          }
        )
        isRunningRef.current = true
        if (isMountedRef.current) setIsStarting(false)
      } catch (err) {
        console.error('Erreur démarrage caméra:', err)
        if (isMountedRef.current) {
          setError("Impossible d'accéder à la caméra. Vérifiez les permissions et que le site est en HTTPS ou localhost.")
          setIsStarting(false)
        }
      }
    }

    startScanner()

    return () => {
      isMountedRef.current = false

      const cleanup = async () => {
        if (!scannerRef.current) return
        try {
          if (scannerRef.current.getState() === 2 /* SCANNING */) {
            await scannerRef.current.stop()
          }
          scannerRef.current.clear()
        } catch (e) {
          // Ignore silencieusement : le scanner n'est peut-être pas démarré
        }
        isRunningRef.current = false
      }

      cleanup()
    }
  }, [onScanSuccess])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-indigo-600" />
            <h2 className="font-semibold text-gray-900">Scanner un QR code</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4">
          {isStarting && !error && (
            <p className="text-center text-sm text-gray-500 py-4">Initialisation de la caméra...</p>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div id={elementId} className="w-full rounded-lg overflow-hidden" />
        </div>

        <div className="border-t border-gray-100 p-3 text-center">
          <p className="text-xs text-gray-500">Placez le QR code dans le cadre</p>
        </div>
      </div>
    </div>
  )
}