'use client'

import { useState } from 'react'
import { createServiceAction } from '@/app/dashboard/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CatalogSelector, CatalogOption, SelectedTicketItem } from '@/components/catalog-selector'
import { Plus, X, Wrench } from 'lucide-react'

interface AddServiceModalProps {
  technicians: { id: string; name: string }[]
  catalogs?: CatalogOption[]
}

export function AddServiceModal({ technicians, catalogs = [] }: AddServiceModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<SelectedTicketItem[]>([])

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    deviceName: '',
    issueDescription: '',
    technicianId: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await createServiceAction({
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerAddress: formData.customerAddress,
        deviceName: formData.deviceName,
        issueDescription: formData.issueDescription,
        technicianId: formData.technicianId || undefined,
        items: selectedItems,
      })

      if (res.success) {
        setSuccessMsg(`Servis berhasil dibuat! Tiket: ${res.service?.ticket_code}`)
        setFormData({
          customerName: '',
          customerPhone: '',
          customerAddress: '',
          deviceName: '',
          issueDescription: '',
          technicianId: '',
        })
        setSelectedItems([])
        setTimeout(() => {
          setIsOpen(false)
          setSuccessMsg(null)
        }, 1500)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal membuat servis')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size="sm" className="bg-primary text-primary-foreground font-medium flex items-center gap-1.5">
        <Plus size={16} />
        <span>Tambah Servis</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative z-[101] bg-neutral-900 text-neutral-100 border border-neutral-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Wrench size={16} />
                </div>
                <h3 className="text-lg font-bold">Pendaftaran Servis Baru</h3>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="customerName">Nama Pelanggan *</Label>
                  <Input
                    id="customerName"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="customerPhone">No. WhatsApp/HP *</Label>
                  <Input
                    id="customerPhone"
                    required
                    placeholder="08123456789"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="customerAddress">Alamat Pelanggan</Label>
                <Input
                  id="customerAddress"
                  placeholder="Kota / Alamat Lengkap"
                  value={formData.customerAddress}
                  onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="deviceName">Nama Perangkat / Laptop *</Label>
                <Input
                  id="deviceName"
                  required
                  placeholder="Contoh: Asus ROG Strix G15"
                  value={formData.deviceName}
                  onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="issueDescription">Keluhan / Kerusakan *</Label>
                <textarea
                  id="issueDescription"
                  required
                  rows={3}
                  className="w-full text-sm border rounded-md p-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Jelaskan kendala perangkat..."
                  value={formData.issueDescription}
                  onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="technicianId">Tugaskan Teknisi (Opsional)</Label>
                <select
                  id="technicianId"
                  className="w-full text-sm border rounded-md p-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.technicianId}
                  onChange={(e) => setFormData({ ...formData, technicianId: e.target.value })}
                >
                  <option value="">-- Pilih Teknisi --</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pemilih Item / Layanan Katalog */}
              <CatalogSelector
                catalogs={catalogs}
                selectedItems={selectedItems}
                onChange={setSelectedItems}
              />

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
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto justify-center font-semibold">
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
