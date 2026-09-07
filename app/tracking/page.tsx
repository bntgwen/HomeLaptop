import { prisma } from '@/lib/prisma'
import { connection } from 'next/server'
import { QRScannerModal } from '@/components/qr-scanner-modal'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function TrackingPage({
  searchParams,
}: {
  searchParams: Promise<{ ticket?: string }>
}) {
  await connection()
  const params = await searchParams
  const ticketQuery = params?.ticket?.trim() || ''

  let serviceData: any = null
  let serviceLogs: any[] = []
  let searchError: string | null = null

  if (ticketQuery) {
    try {
      const service = await prisma.service.findUnique({
        where: { ticket_code: ticketQuery },
        include: {
          customer: {
            select: { name: true, phone: true },
          },
          technician: {
            select: { name: true, phone: true, email: true },
          },
          ticket_items: {
            select: {
              id: true,
              item_name: true,
              price: true,
              quantity: true,
            },
          },
          service_logs: {
            orderBy: { updated_at: 'asc' },
            select: {
              id: true,
              status_stage: true,
              status_note: true,
              updated_at: true,
            },
          },
        },
      })

      if (!service) {
        searchError = 'Tiket servis tidak ditemukan. Mohon periksa kembali kode tiket Anda.'
      } else {
        serviceData = {
          ...service,
          customer_name: service.customer?.name || null,
          users: service.technician,
        }
        serviceLogs = service.service_logs || []
      }
    } catch (err: unknown) {
      searchError = err instanceof Error ? err.message : 'Gagal mencari tiket servis.'
    }
  }

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Diterima':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
      case 'Pengecekan':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
      case 'Perbaikan':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
      case 'Selesai':
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const totalBill = serviceData?.ticket_items?.reduce(
    (acc: number, item: any) => acc + (item.price || 0) * (item.quantity || 1),
    0
  ) || 0

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Kembali ke Beranda"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Lacak Status Servis</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Masukkan Nomor Tiket atau scan QR Code tanda terima servis Anda
            </p>
          </div>
        </div>

        {/* Form Pencarian Tiket & Scanner */}
        <div className="flex flex-col sm:flex-row gap-2">
          <form method="GET" action="/tracking" className="flex-1 flex gap-2">
            <input
              type="text"
              name="ticket"
              defaultValue={ticketQuery}
              placeholder="Masukkan Kode Tiket (misal: TCK-20260825-ABCD)"
              className="flex-1 px-4 py-2.5 rounded-lg border bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg text-sm hover:opacity-90 transition-opacity"
            >
              Lacak
            </button>
          </form>
          <QRScannerModal />
        </div>

        {searchError && (
          <div className="p-4 bg-red-50 dark:bg-red-950/30 text-red-600 rounded-lg text-sm border border-red-200 dark:border-red-900">
            {searchError}
          </div>
        )}

        {serviceData && (
          <div className="border rounded-xl bg-card p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <p className="text-xs text-muted-foreground">Nomor Tiket</p>
                <p className="font-mono text-xl font-bold text-blue-600 dark:text-blue-400">
                  {serviceData.ticket_code}
                </p>
                <p className="font-medium mt-1">{serviceData.device_name || 'Perangkat'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pemilik: {serviceData.customer_name || serviceData.users?.name || 'Pelanggan'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 italic">
                  Keluhan: {serviceData.issue_description ?? '-'}
                </p>

              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(serviceData.status)}`}>
                {serviceData.status}
              </span>
            </div>


            {/* Rincian Item / Sparepart / Layanan */}
            {serviceData.ticket_items && serviceData.ticket_items.length > 0 && (
              <div className="border rounded-xl p-4 bg-muted/20 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold">Rincian Item & Layanan</h3>
                  <span className="text-xs font-mono text-muted-foreground">
                    {serviceData.ticket_items.length} Item
                  </span>
                </div>
                <div className="divide-y border rounded-lg bg-card text-xs overflow-hidden">
                  {serviceData.ticket_items.map((item: any) => (
                    <div key={item.id} className="p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.item_name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatRupiah(item.price)} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-mono font-bold">
                        {formatRupiah(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-2 border-t text-sm font-bold">
                  <span>Total Biaya:</span>
                  <span className="text-primary font-mono text-base">{formatRupiah(totalBill)}</span>
                </div>
              </div>
            )}

            {/* Riwayat Pengerjaan */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Riwayat Progres Pengerjaan</h3>
              {serviceLogs.length > 0 ? (
                <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-muted">
                  {serviceLogs.map((log) => (
                    <div key={log.id} className="relative pl-6">
                      <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-primary border-4 border-background"></div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs">{log.status_stage}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(log.updated_at).toLocaleString('id-ID')}
                        </span>
                      </div>
                      {log.status_note && (
                        <p className="text-xs text-muted-foreground mt-0.5">{log.status_note}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Menunggu update progres awal dari teknisi.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
