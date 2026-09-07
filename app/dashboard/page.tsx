import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { ServiceListRow } from '@/components/service-list-row'
import { AddServiceModal } from '@/components/add-service-modal'
import { AddCatalogModal } from '@/components/add-catalog-modal'
import Link from 'next/link'
import { ServiceStatus } from '@/app/dashboard/actions'
import { ArrowLeft, Globe } from 'lucide-react'

export interface Ticket {
  id: string
  ticket_code: string
  device_name: string
  issue_description?: string | null
  customer_name?: string | null
  customer_phone?: string | null
  status: ServiceStatus | string
  total_price?: number | null
  created_at: string
}

interface UserInfo {
  name: string | null
  phone?: string | null
  email?: string | null
}

export interface ServiceItem {
  id: string
  ticket_code: string
  device_name: string
  issue_description?: string | null
  customer_name?: string | null
  customer_phone?: string | null
  status: ServiceStatus
  total_price?: number | null
  created_at: string
  customers?: { name: string | null; phone: string | null } | null
  users?: UserInfo | null
  technician?: UserInfo | null
  technician_id?: string | null
  ticket_items?: {
    id?: string
    catalog_id: string
    item_name: string
    price: number
    quantity: number
  }[]
}

export default async function DashboardPage() {
  await connection()

  // 1. Cek Autentikasi User dari JWT cookie
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const user = token ? await verifyJWT(token) : null

  if (!user) {
    redirect('/auth/login')
  }

  // Cek role terbaru dari database jika role diubah langsung di Neon DB
  let currentRole = user.role?.toString().toLowerCase() || 'konsumen'
  let currentName = user.name || user.email || 'User'

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, name: true },
    })
    if (dbUser?.role) {
      currentRole = dbUser.role.toString().toLowerCase()
      if (dbUser.name) currentName = dbUser.name
    }
  } catch {
    // Fallback ke token
  }

  // Proteksi Halaman (Server Guard): Hanya admin & teknisi
  if (currentRole !== 'admin' && currentRole !== 'teknisi') {
    redirect('/tracking')
  }

  const isAdmin = currentRole === 'admin'

  // 2. Ambil Data Layanan Servis dari Neon Database via Prisma (proyeksi kolom efisien)
  let serviceItems: ServiceItem[] = []
  let servicesErrorMsg: string | null = null

  try {
    const services = await prisma.service.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        ticket_code: true,
        device_name: true,
        issue_description: true,
        status: true,
        technician_id: true,
        created_at: true,
        customer: {
          select: { name: true, phone: true },
        },
        technician: {
          select: { name: true, phone: true, email: true },
        },
        ticket_items: {
          select: {
            id: true,
            catalog_id: true,
            item_name: true,
            price: true,
            quantity: true,
          },
        },
      },
    })

    serviceItems = services.map((s) => {
      const displayStatus = s.status === 'Bisa_Diambil' ? 'Bisa Diambil' : s.status
      return {
        id: s.id,
        ticket_code: s.ticket_code,
        device_name: s.device_name,
        issue_description: s.issue_description,
        customer_name: s.customer?.name || null,
        customer_phone: s.customer?.phone || null,
        status: displayStatus as ServiceStatus,
        technician_id: s.technician_id,
        created_at: s.created_at.toISOString(),
        customers: s.customer ? { name: s.customer.name, phone: s.customer.phone } : null,
        users: s.technician ? { name: s.technician.name, phone: s.technician.phone, email: s.technician.email } : null,
        technician: s.technician ? { name: s.technician.name, phone: s.technician.phone, email: s.technician.email } : null,
        ticket_items: s.ticket_items.map((item) => ({
          id: item.id,
          catalog_id: item.catalog_id || '',
          item_name: item.item_name,
          price: item.price,
          quantity: item.quantity,
        })),
      }
    })
  } catch (err: unknown) {
    servicesErrorMsg = err instanceof Error ? err.message : 'Gagal mengambil data tiket servis'
  }

  // 3. Jika Admin, ambil data statistik & teknisi untuk modal secara efisien
  let techniciansList: { id: string; name: string }[] = []
  let catalogsList: any[] = []
  let totalProducts = 0

  if (isAdmin) {
    try {
      const [techData, catalogsData, catCount] = await Promise.all([
        prisma.user.findMany({
          where: { role: 'teknisi' },
          select: { id: true, name: true },
        }),
        prisma.catalog.findMany({
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            title: true,
            category: true,
            price: true,
            stock: true,
            description: true,
            image_url: true,
            image_urls: true,
          },
        }),
        prisma.catalog.count(),
      ])

      techniciansList = techData.map((t) => ({ id: t.id, name: t.name || 'Teknisi' }))
      catalogsList = catalogsData
      totalProducts = catCount
    } catch {
      // Fallback
    }
  }

  const allServices = serviceItems || []
  const countDiterima = allServices.filter(
    (s) => s.status === 'Diterima' || s.status === 'Pending'
  ).length
  const countProses = allServices.filter(
    (s) => s.status === 'Pengecekan' || s.status === 'Perbaikan' || s.status === 'Diproses'
  ).length
  const countSelesai = allServices.filter(
    (s) => s.status === 'Selesai' || s.status === 'Bisa Diambil'
  ).length

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Kembali ke Beranda"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Dashboard Servis</h1>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                  isAdmin
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                    : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                }`}
              >
                {currentRole}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Selamat datang, <span className="font-semibold text-foreground">{currentName}</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Admin Quick Action & Stats Cards */}
      {isAdmin && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/40 p-4 rounded-xl border">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Aksi Cepat Administrator
              </h2>
              <p className="text-xs text-muted-foreground">Kelola operasional dan katalog sistem</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <AddServiceModal technicians={techniciansList} catalogs={catalogsList} />
              <AddCatalogModal />
              <Link
                href="/catalogs"
                className="text-xs px-3 py-2 border rounded-md hover:bg-background transition-colors font-medium flex items-center gap-1.5"
              >
                <Globe size={14} />
                <span>Lihat Katalog ({totalProducts})</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl border bg-card text-card-foreground">
              <p className="text-xs text-muted-foreground">Total Servis</p>
              <p className="text-2xl font-bold mt-1">{allServices.length}</p>
            </div>
            <div className="p-4 rounded-xl border bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-200">
              <p className="text-xs font-medium">Diterima</p>
              <p className="text-2xl font-bold mt-1">{countDiterima}</p>
            </div>
            <div className="p-4 rounded-xl border bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200">
              <p className="text-xs font-medium">Dalam Proses</p>
              <p className="text-2xl font-bold mt-1">{countProses}</p>
            </div>
            <div className="p-4 rounded-xl border bg-green-50/50 dark:bg-green-950/20 text-green-900 dark:text-green-200">
              <p className="text-xs font-medium">Selesai</p>
              <p className="text-2xl font-bold mt-1">{countSelesai}</p>
            </div>
          </div>
        </div>
      )}

      {/* Teknisi View Notice */}
      {!isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border bg-blue-50/50 dark:bg-blue-950/20">
            <p className="text-xs text-muted-foreground">Antrean Menunggu</p>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-0.5">{countDiterima}</p>
          </div>
          <div className="p-3 rounded-lg border bg-amber-50/50 dark:bg-amber-950/20">
            <p className="text-xs text-muted-foreground">Sedang Dikerjakan</p>
            <p className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-0.5">{countProses}</p>
          </div>
          <div className="p-3 rounded-lg border bg-green-50/50 dark:bg-green-950/20">
            <p className="text-xs text-muted-foreground">Siap Diambil</p>
            <p className="text-xl font-bold text-green-700 dark:text-green-300 mt-0.5">{countSelesai}</p>
          </div>
        </div>
      )}

      {/* Tabel / List Antrean Servis */}
      <div className="border rounded-xl bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-muted/20">
          <div>
            <h2 className="text-base font-semibold">Daftar Antrean & Status Servis</h2>
            <p className="text-xs text-muted-foreground">
              {isAdmin
                ? 'Admin dapat memantau, menambah, dan mengarahkan tiket'
                : 'Teknisi dapat memperbarui status pengerjaan secara langsung'}
            </p>
          </div>
          <span className="text-xs font-mono bg-muted px-2.5 py-1 rounded-md">
            {allServices.length} Tiket
          </span>
        </div>

        {servicesErrorMsg && (
          <div className="p-4 text-sm text-red-500 bg-red-50 dark:bg-red-950/20 border-b">
            Gagal mengambil data tiket servis: {servicesErrorMsg}
          </div>
        )}

        <div className="p-4">
          {allServices.length > 0 ? (
            <ul className="divide-y">
              {allServices.map((srv) => (
                <ServiceListRow
                  key={srv.id}
                  service={srv}
                  userRole={currentRole}
                  technicians={techniciansList}
                  catalogs={catalogsList}
                />
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground italic text-sm py-8 text-center">
              Belum ada data servis yang terdaftar di database.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}