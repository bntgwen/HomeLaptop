'use client'

import { useState } from 'react'
import { updateServiceTicketAction, ServiceStatus } from '@/app/dashboard/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CatalogSelector, CatalogOption, SelectedTicketItem } from '@/components/catalog-selector'
import { Pencil, Wrench, X } from 'lucide-react'

export interface TicketDetail {
  id: string
  ticket_code: string
  device_name: string
  issue_description?: string | null
  customer_name?: string | null
  customer_phone?: string | null
  status: ServiceStatus | string
  total_price?: number | null
  created_at: string
  customers?: { name: string | null; phone: string | null } | null
  users?: { name: string | null; phone?: string | null; email?: string | null } | null
  technician?: { name: string | null } | null
  technician_id?: string | null
  ticket_items?: {
    id?: string
    catalog_id: string
    item_name: string
    price: number
    quantity: number
  }[]
}



interface EditServiceModalProps {
  service: TicketDetail
  technicians: { id: string; name: string }[]
  catalogs?: CatalogOption[]
  trigger?: React.ReactNode
}

const ALL_STATUS_OPTIONS: ServiceStatus[] = [
  'Pending',
  'Diterima',
  'Pengecekan',
  'Diproses',
  'Perbaikan',
  'Selesai',
  'Bisa Diambil',
  'Batal',
]

export function EditServiceModal({
  service,
  technicians,
  catalogs = [],
  trigger,
}: EditServiceModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Form states
  const [deviceName, setDeviceName] = useState(service.device_name)
  const [issueDescription, setIssueDescription] = useState(service.issue_description || '')
  const [status, setStatus] = useState<ServiceStatus>((service.status as ServiceStatus) || 'Diterima')
  const [technicianId, setTechnicianId] = useState(service.technician_id || '')
  const [statusNote, setStatusNote] = useState('')
  const [selectedItems, setSelectedItems] = useState<SelectedTicketItem[]>(
    service.ticket_items?.map((item) => ({
      catalog_id: item.catalog_id,
      item_name: item.item_name,
      price: item.price,
      quantity: item.quantity,
    })) || []
  )

  const handleOpen = () => {
    setDeviceName(service.device_name)
    setIssueDescription(service.issue_description || '')
    setStatus((service.status as ServiceStatus) || 'Diterima')
    setTechnicianId(service.technician_id || '')
    setStatusNote('')

    setSelectedItems(
      service.ticket_items?.map((item) => ({
        catalog_id: item.catalog_id,
        item_name: item.item_name,
        price: item.price,
        quantity: item.quantity,
      })) || []
    )
    setError(null)
    setSuccessMsg(null)
    setIsOpen(true)
  }

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val)
  }

  const totalEstimatedCost = selectedItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await updateServiceTicketAction({
        serviceId: service.id,
        deviceName,
        issueDescription,
        status,
        technicianId: technicianId || null,
        statusNote: statusNote || undefined,
        items: selectedItems,
      })

      if (res.success) {
        setSuccessMsg(`Tiket #${service.ticket_code} berhasil diperbarui!`)
        setTimeout(() => {
          setIsOpen(false)
          setSuccessMsg(null)
        }, 1200)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui tiket servis')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {trigger ? (
        <div onClick={handleOpen} className="inline-block">
          {trigger}
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpen}
          className="text-xs h-7 px-2.5 flex items-center gap-1.5 hover:bg-muted"
        >
          <Pencil size={13} />
          <span>Edit Tiket</span>
        </Button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative z-[101] bg-neutral-900 text-neutral-100 border border-neutral-800 rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Wrench size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold">Edit Tiket Servis</h3>
                  <p className="text-xs font-mono text-muted-foreground">
                    #{service.ticket_code} • {service.users?.name || 'Pelanggan'}
                  </p>
                </div>
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

            {error && (
              <div className="p-3 bg-red-950/50 text-red-300 text-xs rounded-lg border border-red-800">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-green-950/50 text-green-300 text-xs font-semibold rounded-lg border border-green-800">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Device & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-deviceName">Nama Perangkat / Unit *</Label>
                  <Input
                    id="edit-deviceName"
                    required
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-status">Status Servis *</Label>
                  <select
                    id="edit-status"
                    className="w-full text-sm border rounded-md p-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ServiceStatus)}
                  >
                    {ALL_STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Teknisi PIC & Catatan Progres */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-tech">Teknisi Penanggung Jawab</Label>
                  <select
                    id="edit-tech"
                    className="w-full text-sm border rounded-md p-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={technicianId}
                    onChange={(e) => setTechnicianId(e.target.value)}
                  >
                    <option value="">-- Belum Ditugaskan --</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-note">Catatan Progres Tambahan</Label>
                  <Input
                    id="edit-note"
                    placeholder="Contoh: Menunggu part pengganti..."
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                  />
                </div>
              </div>

              {/* Keluhan / Kerusakan */}
              <div className="space-y-1">
                <Label htmlFor="edit-issue">Deskripsi Keluhan / Masalah</Label>
                <textarea
                  id="edit-issue"
                  rows={2}
                  className="w-full text-sm border rounded-md p-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                />
              </div>

              {/* Item Katalog & Layanan Tambahan */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="font-semibold text-xs text-muted-foreground uppercase">
                    Rincian Item / Sparepart / Jasa
                  </Label>
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                    Total: {formatRupiah(totalEstimatedCost)}
                  </span>
                </div>

                <CatalogSelector
                  catalogs={catalogs}
                  selectedItems={selectedItems}
                  onChange={setSelectedItems}
                />
              </div>

              {/* Tombol Aksi */}
              <div className="pt-3 border-t flex flex-col-reverse sm:flex-row sm:justify-end gap-2 w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                  className="w-full sm:w-auto justify-center"
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto justify-center bg-primary text-primary-foreground font-semibold">
                  {isLoading ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
