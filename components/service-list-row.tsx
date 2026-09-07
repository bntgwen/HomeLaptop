'use client'

import { useState } from 'react'
import {
  updateServiceStatusAction,
  deleteServiceTicketAction,
  ServiceStatus,
} from '@/app/dashboard/actions'
import { Button } from '@/components/ui/button'
import { PrintReceiptModal } from '@/components/print-receipt-modal'
import { EditServiceModal, TicketDetail } from '@/components/edit-service-modal'
import { CatalogOption } from '@/components/catalog-selector'
import { MessageSquare, Trash2, AlertTriangle, Loader2 } from 'lucide-react'

interface ServiceRowProps {
  service: TicketDetail
  userRole: 'admin' | 'teknisi' | string
  technicians?: { id: string; name: string }[]
  catalogs?: CatalogOption[]
}

const STATUS_OPTIONS: ServiceStatus[] = [
  'Pending',
  'Diterima',
  'Pengecekan',
  'Diproses',
  'Perbaikan',
  'Selesai',
  'Bisa Diambil',
  'Batal',
]

export function ServiceListRow({
  service,
  userRole,
  technicians = [],
  catalogs = [],
}: ServiceRowProps) {
  const [currentStatus, setCurrentStatus] = useState<ServiceStatus>(
    (service.status as ServiceStatus) || 'Diterima'
  )

  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  )

  const handleStatusChange = async (newStatus: ServiceStatus) => {
    if (newStatus === currentStatus) return
    setIsUpdating(true)
    setFeedback(null)

    try {
      await updateServiceStatusAction(service.id, newStatus)
      setCurrentStatus(newStatus)
      setFeedback({ type: 'success', message: `Status diubah menjadi: ${newStatus}` })
      setTimeout(() => setFeedback(null), 3000)
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal memperbarui status',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteTicket = async () => {
    setIsDeleting(true)
    setFeedback(null)

    try {
      await deleteServiceTicketAction(service.id)
      setShowDeleteConfirm(false)
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal menghapus tiket servis',
      })
      setIsDeleting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'
      case 'Diterima':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
      case 'Pengecekan':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
      case 'Diproses':
      case 'Perbaikan':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
      case 'Selesai':
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
      case 'Bisa Diambil':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 ring-1 ring-emerald-500/30'
      case 'Batal':
        return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const formatPhoneNumber = (phone?: string | null) => {
    if (!phone) return ''
    let cleaned = phone.replace(/\D/g, '')
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1)
    }
    return cleaned
  }

  const handleSendWhatsApp = (ticketCode: string, targetPhone?: string | null) => {
    const formattedPhone = formatPhoneNumber(targetPhone)
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://neocomp.id'
    const trackingLink = `${origin}/tracking?ticket=${encodeURIComponent(ticketCode)}`
    const message = `Halo, berikut adalah QR / Tautan tracking untuk status servis kamu dengan nomor tiket #${ticketCode}: ${trackingLink}`

    const waUrl = formattedPhone
      ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`

    window.open(waUrl, '_blank')
  }

  return (
    <li className="py-4 space-y-3">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
              {service.ticket_code}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(service.created_at).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          <p className="font-semibold text-sm">{service.device_name || 'Perangkat'}</p>
          <p className="text-xs text-muted-foreground">
            Pelanggan:{' '}
            <span className="font-medium text-foreground">
              {service.customer_name ||
                service.customers?.name ||
                service.users?.name ||
                'Pelanggan'}
            </span>{' '}
            (
            {service.customer_phone ||
              service.customers?.phone ||
              service.users?.phone ||
              service.users?.email ||
              '-'}
            )
            {service.technician?.name && (
              <span>
                {' '}
                • Teknisi: <span className="font-medium text-foreground">{service.technician.name}</span>
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground italic line-clamp-1">
            &quot;{service.issue_description ?? '-'}&quot;
          </p>


        </div>


        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(currentStatus)}`}>
            {currentStatus}
          </span>

          {/* Cetak Struk / QR Button */}
          <PrintReceiptModal service={service} />

          {/* Edit Tiket Servis (Admin & Teknisi) */}
          <EditServiceModal
            service={service}
            technicians={technicians}
            catalogs={catalogs}
          />

          {/* Tombol Kirim WA Tracking */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSendWhatsApp(service.ticket_code, service.users?.phone)}
            className="text-xs h-7 px-2 border-green-300 text-green-700 dark:text-green-400 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-950/40 flex items-center gap-1.5"
          >
            <MessageSquare size={13} />
            <span>Kirim WA</span>
          </Button>

          {/* Tombol Hapus Tiket (Khusus Admin) */}
          {userRole === 'admin' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs h-7 px-2 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/40 flex items-center justify-center"
              title="Hapus Tiket"
            >
              <Trash2 size={13} />
            </Button>
          )}

          {/* Opsi Update Status Cepat */}
          <div className="flex items-center gap-1.5 ml-1">
            <select
              value={currentStatus}
              onChange={(e) => handleStatusChange(e.target.value as ServiceStatus)}
              disabled={isUpdating}
              className="text-xs border rounded-lg px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer disabled:opacity-50"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  Ubah: {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`text-xs p-2.5 rounded-lg font-medium ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300'
              : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Modal Dialog Konfirmasi Hapus Tiket */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative z-[101] bg-neutral-900 text-neutral-100 border border-neutral-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto border border-red-500/20">
                <AlertTriangle size={24} />
              </div>
              <h3 className="font-bold text-base">Hapus Tiket Servis?</h3>
              <p className="text-xs text-muted-foreground">
                Apakah Anda yakin ingin menghapus tiket{' '}
                <strong className="font-mono text-foreground">#{service.ticket_code}</strong>? Data
                rincian pengerjaan dan item tiket akan dihapus permanen. Tindakan ini{' '}
                <strong className="text-red-500">tidak dapat dibatalkan</strong>.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="border-neutral-700 hover:bg-neutral-800 text-neutral-200"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleDeleteTicket}
                disabled={isDeleting}
                className="bg-red-600 text-white hover:bg-red-700 font-semibold flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Ya, Hapus Tiket</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </li>
  )
}

