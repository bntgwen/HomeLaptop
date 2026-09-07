'use client'

import { useState, useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Printer, Download, Share2, X } from 'lucide-react'

interface PrintReceiptModalProps {
  service: {
    id: string
    ticket_code: string
    device_name: string
    issue_description?: string | null
    status: string
    created_at: string
    users?: { name: string | null; phone?: string | null; email?: string | null } | null
    technician?: { name: string | null } | null
  }
}



export function PrintReceiptModal({ service }: PrintReceiptModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const qrWrapperRef = useRef<HTMLDivElement | null>(null)

  // URL pelacakan publik
  const trackingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/tracking?ticket=${encodeURIComponent(service.ticket_code)}`
    : `https://neocomp.id/tracking?ticket=${service.ticket_code}`

  // Cetak Nota fisik
  const handlePrint = () => {
    window.print()
  }

  // Unduh QR Code sebagai file PNG menggunakan canvas toDataURL
  const handleDownloadPNG = () => {
    try {
      setIsDownloading(true)
      const canvas = qrWrapperRef.current?.querySelector('canvas') as HTMLCanvasElement | null
      if (!canvas) {
        throw new Error('Elemen canvas QR Code tidak ditemukan.')
      }

      const pngUrl = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.href = pngUrl
      downloadLink.download = `QR-${service.ticket_code}.png`
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
    } catch (err) {
      console.error('Download QR failed:', err)
    } finally {
      setIsDownloading(false)
    }
  }

  // Format nomor WhatsApp (hapus karakter non-digit dan ubah awalan 0 menjadi 62)
  const formatPhoneNumber = (phone?: string | null) => {
    if (!phone) return ''
    let cleaned = phone.replace(/\D/g, '')
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1)
    }
    return cleaned
  }

  // Bagikan Tiket (PWA Web Share API & Fallback WhatsApp)
  const handleShare = async () => {
    const shareTitle = `Status Servis - ${service.device_name} (${service.ticket_code})`
    const shareText = `Halo ${service.users?.name || 'Pelanggan'}, berikut adalah tanda terima servis perangkat ${service.device_name}.\n\nKode Tiket: ${service.ticket_code}\nStatus Saat Ini: ${service.status}\n\nLacak progres perbaikan secara real-time melalui link:`

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `${shareText}\n${trackingUrl}`,
          url: trackingUrl,
        })
        return
      } catch (err) {
        // User cancel atau share error, lanjutkan ke opsi fallback
      }
    }

    // Fallback WhatsApp
    const waPhone = formatPhoneNumber(service.users?.phone)
    const waText = encodeURIComponent(`${shareText}\n${trackingUrl}\n\nTerima kasih telah mempercayakan perbaikan di Home Laptop (NeoComp).`)
    const waUrl = waPhone
      ? `https://wa.me/${waPhone}?text=${waText}`
      : `https://wa.me/?text=${waText}`

    window.open(waUrl, '_blank')
  }


  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-xs h-7 px-2 border-dashed flex items-center gap-1.5 hover:bg-muted"
      >
        <Printer size={13} />
        <span>Struk & QR</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative z-[101] bg-neutral-900 text-neutral-100 border border-neutral-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 max-h-[95vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3 no-print">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Printer size={16} />
                </div>
                <h3 className="text-base font-bold">Tanda Terima Servis & QR Code</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
                title="Tutup Modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Area Struk Fisik / Cetak */}
            <div id="printable-receipt" className="border border-neutral-300 rounded-xl p-5 bg-white text-black space-y-4 text-center">
              <div className="border-b pb-3 space-y-1">
                <h2 className="text-lg font-extrabold uppercase tracking-wide text-zinc-900">
                  UKK Servis Laptop (NeoComp)
                </h2>
                <p className="text-[11px] text-zinc-600">
                  Jasa Servis & Repair Laptop/PC Terintegrasi Real-Time
                </p>
              </div>

              {/* QR Code Container */}
              <div
                ref={qrWrapperRef}
                className="flex flex-col items-center justify-center p-3 bg-zinc-50 rounded-lg border border-dashed border-zinc-300"
              >
                <QRCodeCanvas
                  value={trackingUrl}
                  size={140}
                  level="H"
                  includeMargin={true}
                />
                <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                  Scan untuk Lacak Status
                </p>
              </div>

              {/* Detail Tiket di Struk */}
              <div className="space-y-2 text-left text-xs border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Kode Tiket:</span>
                  <span className="font-mono font-bold text-zinc-900">#{service.ticket_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Pelanggan:</span>
                  <span className="font-semibold text-zinc-900">{service.users?.name || 'Pelanggan'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Perangkat:</span>
                  <span className="font-semibold text-zinc-900">{service.device_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Status Awal:</span>
                  <span className="font-semibold text-zinc-900">{service.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Tanggal Masuk:</span>
                  <span className="text-zinc-700">
                    {new Date(service.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              <div className="border-t pt-3 text-[10px] text-zinc-500 text-center leading-tight">
                Simpan nota atau foto QR Code ini sebagai bukti pengambilan unit yang sah.
              </div>
            </div>

            {/* Opsi Digital: Unduh PNG & Bagikan */}
            <div className="grid grid-cols-2 gap-2 no-print">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPNG}
                disabled={isDownloading}
                className="text-xs flex items-center justify-center gap-1.5 border-neutral-700 hover:bg-neutral-800 text-neutral-200"
              >
                <Download size={14} />
                <span>{isDownloading ? 'Mengunduh...' : 'Unduh QR'}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="text-xs flex items-center justify-center gap-1.5 text-green-400 border-green-800/60 hover:bg-green-950/30"
              >
                <Share2 size={14} />
                <span>Bagikan Tiket</span>
              </Button>
            </div>

            {/* Tombol Aksi Utama Cetak / Tutup */}
            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800 no-print">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-neutral-400 hover:text-neutral-200"
              >
                Tutup
              </Button>
              <Button
                size="sm"
                onClick={handlePrint}
                className="bg-primary text-primary-foreground font-semibold flex items-center gap-1.5"
              >
                <Printer size={14} />
                <span>Cetak Nota</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
