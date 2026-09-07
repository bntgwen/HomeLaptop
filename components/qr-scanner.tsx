'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Html5Qrcode } from 'html5-qrcode'
import { Button } from '@/components/ui/button'
import { QrCode, Scan, X, Camera, UploadCloud } from 'lucide-react'

export function QRScanner() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'camera' | 'file'>('camera')
  const [isScanning, setIsScanning] = useState(false)
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const router = useRouter()
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop()
        await scannerRef.current.clear()
      } catch (err) {
        console.error('Error stopping scanner:', err)
      }
    }
    setIsScanning(false)
  }

  const handleClose = async () => {
    await stopScanner()
    setIsOpen(false)
    setErrorMsg(null)
  }

  const handleScanSuccess = async (decodedText: string) => {
    let ticketCode = decodedText.trim()

    // Ekstrak kode tiket jika hasil scan merupakan URL tracking
    if (ticketCode.includes('ticket=')) {
      try {
        const url = new URL(ticketCode)
        ticketCode = url.searchParams.get('ticket') || ticketCode
      } catch {
        const match = ticketCode.match(/ticket=([^&]+)/)
        if (match && match[1]) {
          ticketCode = decodeURIComponent(match[1])
        }
      }
    }

    await stopScanner()
    setIsOpen(false)
    router.push(`/tracking?ticket=${encodeURIComponent(ticketCode)}`)
  }

  const startCameraScanner = async () => {
    setErrorMsg(null)
    setIsScanning(true)

    try {
      setTimeout(async () => {
        try {
          const html5QrCode = new Html5Qrcode('qr-reader-container')
          scannerRef.current = html5QrCode

          await html5QrCode.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 240, height: 240 },
            },
            (decodedText) => {
              handleScanSuccess(decodedText)
            },
            () => {
              // Frame scan normal, abaikan error per frame
            }
          )
        } catch (err: unknown) {
          setErrorMsg(
            err instanceof Error
              ? `Kamera gagal diakses: ${err.message}. Anda dapat menggunakan tab "Unggah Foto QR" di bawah.`
              : 'Gagal mengakses kamera. Silakan pilih tab "Unggah Foto QR".'
          )
          setIsScanning(false)
        }
      }, 300)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Kamera tidak dapat dimulai')
      setIsScanning(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessingFile(true)
    setErrorMsg(null)

    try {
      // Instance baru scanner untuk memindai file gambar
      const html5QrCode = new Html5Qrcode('qr-file-processor')
      const decodedText = await html5QrCode.scanFile(file, true)
      await html5QrCode.clear()
      await handleScanSuccess(decodedText)
    } catch (err: unknown) {
      setErrorMsg('QR Code tidak terdeteksi pada gambar ini. Pastikan gambar jelas dan tidak buram.')
    } finally {
      setIsProcessingFile(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCameraScanner()
    } else {
      stopScanner()
    }
    return () => {
      stopScanner()
    }
  }, [isOpen, activeTab])

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setIsOpen(true)
          setActiveTab('camera')
        }}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-primary/40 hover:bg-primary/10"
      >
        <Scan size={16} />
        <span>Scan QR</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative z-[101] bg-neutral-900 text-neutral-100 border border-neutral-800 rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4">
            {/* Header Modal */}
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <QrCode size={16} />
                </div>
                <h3 className="font-bold text-base">Pindai QR Tanda Terima</h3>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
                title="Tutup Modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tab Selector: Kamera Live vs Upload Foto */}
            <div className="flex rounded-lg bg-neutral-800 p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('camera')}
                className={`flex-1 py-1.5 rounded-md font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'camera'
                    ? 'bg-neutral-900 text-foreground shadow-sm'
                    : 'text-neutral-400 hover:text-foreground'
                }`}
              >
                <Camera size={14} />
                <span>Kamera Live</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('file')}
                className={`flex-1 py-1.5 rounded-md font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'file'
                    ? 'bg-neutral-900 text-foreground shadow-sm'
                    : 'text-neutral-400 hover:text-foreground'
                }`}
              >
                <UploadCloud size={14} />
                <span>Upload Foto</span>
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 text-xs rounded-lg border border-red-200">
                {errorMsg}
              </div>
            )}

            {/* Mode Kamera Live */}
            {activeTab === 'camera' && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground text-center">
                  Arahkan kamera perangkat ke QR Code pada tanda terima Anda.
                </p>
                <div className="relative rounded-xl overflow-hidden bg-black aspect-square flex items-center justify-center border-2 border-primary/40">
                  <div id="qr-reader-container" className="w-full h-full" />
                  {isScanning && !errorMsg && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                      <div className="w-52 h-52 border-2 border-primary border-dashed rounded-lg animate-pulse" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mode Unggah Foto / Screenshot */}
            {activeTab === 'file' && (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground text-center">
                  Pilih foto nota atau tangkapan layar (screenshot) QR Code dari galeri perangkat.
                </p>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-muted-foreground/30 hover:border-primary/60 rounded-xl p-8 text-center cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <span className="text-4xl block mb-2">🖼️</span>
                  <p className="text-xs font-semibold text-foreground">
                    {isProcessingFile ? 'Memindai Gambar...' : 'Klik untuk Pilih Gambar QR'}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Mendukung JPG, PNG, WEBP
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {/* Hidden container for file scanning */}
                <div id="qr-file-processor" className="hidden" />
              </div>
            )}

            {/* Tombol Tutup */}
            <div className="flex justify-center pt-2 border-t">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClose}
                className="w-full"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Export alias untuk kompatibilitas nama QRScannerModal
export const QRScannerModal = QRScanner
