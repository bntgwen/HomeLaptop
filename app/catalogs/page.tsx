import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth'
import { connection } from 'next/server'
import { CatalogGrid, CatalogItem } from '@/components/catalog-grid'
import Link from 'next/link'
import { ArrowLeft, Search, Wrench } from 'lucide-react'

export default async function CatalogsPage() {
  await connection()

  // Cek apakah user sedang login sebagai admin/teknisi via JWT
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const user = token ? await verifyJWT(token) : null

  const canManage = user?.role === 'admin' || user?.role === 'teknisi'

  // Ambil data katalog dengan select kolom yang dibutuhkan saja
  let catalogList: CatalogItem[] = []
  let catalogErrorMsg: string | null = null

  try {
    const catalogs = await prisma.catalog.findMany({
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
        created_at: true,
      },
    })

    catalogList = catalogs.map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      price: item.price,
      stock: item.stock,
      description: item.description,
      image_url: item.image_url,
      image_urls: item.image_urls,
      created_at: item.created_at ? item.created_at.toISOString() : null,
    }))
  } catch (err: unknown) {
    catalogErrorMsg = err instanceof Error ? err.message : 'Gagal memuat katalog'
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Kembali ke Beranda"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Katalog Produk & Layanan</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pilihan laptop bekas bergaransi, suku cadang resmi, dan paket perbaikan profesional
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/tracking"
              className="text-xs px-3 py-2 border rounded-xl hover:bg-muted font-medium flex items-center gap-1.5"
            >
              <Search size={14} />
              <span>Lacak Servis</span>
            </Link>
            <Link
              href="/dashboard"
              className="text-xs px-3 py-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 font-semibold flex items-center gap-1.5"
            >
              <Wrench size={14} />
              <span>Servis Sekarang</span>
            </Link>
          </div>
        </div>

        {catalogErrorMsg && (
          <div className="p-4 bg-red-50 dark:bg-red-950/30 text-red-600 rounded-xl text-sm border border-red-200 dark:border-red-900">
            Gagal memuat katalog: {catalogErrorMsg}
          </div>
        )}

        {/* Komponen Grid Katalog Interaktif */}
        <CatalogGrid catalogs={catalogList} canManage={canManage} />
      </div>
    </div>
  )
}
