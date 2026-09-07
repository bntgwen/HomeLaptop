'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { EditCatalogModal } from '@/components/edit-catalog-modal'
import { deleteCatalogItemAction } from '@/app/dashboard/actions'
import { Pencil, Trash2, Eye, MessageSquare, Search, Laptop, Loader2 } from 'lucide-react'

export interface CatalogItem {
  id: string
  title: string
  category?: string | null
  price?: number | null
  stock?: number | null
  description?: string | null
  image_url?: string | null
  image_urls?: string[] | null
  created_at?: string | null
}

export type ProductItem = CatalogItem

interface CatalogGridProps {
  catalogs?: CatalogItem[]
  products?: CatalogItem[]
  canManage?: boolean
}

const CATEGORIES = ['Semua', 'Laptop Bekas', 'Sparepart', 'Aksesoris', 'Komponen']

function normalizeCategoryName(cat?: string | null): string {
  if (!cat) return 'Lainnya'
  if (cat === 'Laptop_Bekas' || cat.toLowerCase() === 'laptop bekas') return 'Laptop Bekas'
  if (cat.toLowerCase() === 'sparepart') return 'Sparepart'
  if (cat.toLowerCase() === 'aksesoris') return 'Aksesoris'
  if (cat.toLowerCase() === 'komponen') return 'Komponen'
  return cat
}

export function CatalogGrid({ catalogs, products, canManage = false }: CatalogGridProps) {
  const catalogList = catalogs || products || []
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [searchQuery, setSearchQuery] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Filter produk berdasarkan kategori dan pencarian
  const filteredCatalogs = catalogList.filter((item) => {
    const itemCategory = normalizeCategoryName(item.category)
    const itemTitle = item.title || ''
    const itemDesc = item.description || ''

    const matchCategory = selectedCategory === 'Semua' || itemCategory === selectedCategory
    const matchSearch =
      itemTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      itemDesc.toLowerCase().includes(searchQuery.toLowerCase())

    return matchCategory && matchSearch
  })

  const [itemToDelete, setItemToDelete] = useState<CatalogItem | null>(null)
  const [itemToEdit, setItemToEdit] = useState<CatalogItem | null>(null)

  // Eksekusi Hapus Item Katalog dari database Neon
  const handleConfirmDeleteCatalog = async () => {
    if (!itemToDelete) return
    const item = itemToDelete

    setDeletingId(item.id)
    setActionFeedback(null)

    try {
      await deleteCatalogItemAction(item.id)
      setActionFeedback({
        type: 'success',
        message: `Item katalog "${item.title}" berhasil dihapus secara permanen.`,
      })
      setItemToDelete(null)
      setTimeout(() => setActionFeedback(null), 3500)
    } catch (err: unknown) {
      setActionFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal menghapus produk katalog',
      })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {actionFeedback && (
        <div
          className={`p-3 rounded-xl text-xs font-medium border transition-all ${
            actionFeedback.type === 'success'
              ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800'
              : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
          }`}
        >
          {actionFeedback.message}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-muted rounded-xl text-xs font-medium">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedCategory === cat
                  ? 'bg-card text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Cari laptop, part, atau jasa servis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-lg border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Grid Produk & Layanan */}
      {filteredCatalogs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCatalogs.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              canManage={canManage}
              isDeleting={deletingId === item.id}
              onEdit={() => setItemToEdit(item)}
              onDelete={() => setItemToDelete(item)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border rounded-2xl bg-card p-6 space-y-2">
          <Search size={36} className="mx-auto text-muted-foreground/60" />
          <h3 className="font-semibold text-base">Tidak ada produk yang cocok</h3>
          <p className="text-xs text-muted-foreground">
            Coba ganti kata kunci pencarian atau pilih kategori lain.
          </p>
        </div>
      )}

      {/* Modal Dialog Edit Katalog Terisolasi di Level Root */}
      {itemToEdit && (
        <EditCatalogModal
          product={itemToEdit}
          isOpen={true}
          onClose={() => setItemToEdit(null)}
        />
      )}

      {/* Modal Dialog Konfirmasi Hapus Katalog */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative z-[101] bg-neutral-900 text-neutral-100 border border-neutral-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto border border-red-500/20">
                <Trash2 size={24} />
              </div>
              <h3 className="font-bold text-base">Hapus Item Katalog?</h3>
              <p className="text-xs text-muted-foreground">
                Apakah Anda yakin ingin menghapus item{' '}
                <strong className="text-foreground">&quot;{itemToDelete.title}&quot;</strong> dari database? Tindakan ini{' '}
                <strong className="text-red-500">tidak dapat dibatalkan</strong>.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={Boolean(deletingId)}
                className="px-3 py-1.5 text-xs rounded-lg border border-neutral-700 hover:bg-neutral-800 font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCatalog}
                disabled={Boolean(deletingId)}
                className="px-3 py-1.5 text-xs rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-1.5"
              >
                {deletingId ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Ya, Hapus Permanen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Kartu Produk dengan Next.js <Image /> dan Link ke Detail Show Page
 */
function ProductCard({
  item,
  canManage,
  isDeleting,
  onEdit,
  onDelete,
}: {
  item: CatalogItem
  canManage: boolean
  isDeleting: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const images = (item.image_urls && item.image_urls.length > 0)
    ? item.image_urls
    : (item.image_url ? [item.image_url] : [])

  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const formatRupiah = (val?: number | null) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val ?? 0)
  }

  const handleOrderWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const message = `Halo admin, saya tertarik dengan layanan/produk: ${item.title || 'Layanan'}.`
    const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(waUrl, '_blank')
  }

  const activeImage = images[activeImageIndex] || null
  const itemStock = item.stock ?? 0
  const itemPrice = item.price ?? 0
  const itemCategory = normalizeCategoryName(item.category)

  return (
    <div className="border rounded-2xl bg-card text-card-foreground shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group">
      {/* Container Gambar Utama & Galeri */}
      <div className="w-full">
        {/* Container Gambar Utama */}
        <div className="relative w-full h-48 sm:h-64 overflow-hidden rounded-t-xl bg-neutral-900">
          <Link href={`/catalogs/${item.id}`} className="block w-full h-full cursor-pointer">
            {activeImage ? (
              <Image
                src={activeImage}
                alt={item.title || 'Produk Katalog'}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-muted-foreground">
                <Laptop size={28} className="mb-1 opacity-60" />
                <span className="text-xs">Foto belum tersedia</span>
              </div>
            )}
          </Link>

          {/* Tombol Manajemen Admin (Edit & Hapus) di dalam Container Gambar Utama */}
          {canManage && (
            <div
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              className="absolute top-3 left-3 z-10 flex gap-2"
            >
              <button
                type="button"
                title="Edit Produk"
                onClick={onEdit}
                className="p-2 bg-black/60 backdrop-blur-md text-white rounded-lg hover:bg-black/80 transition flex items-center justify-center text-xs font-bold shadow-sm"
              >
                <Pencil size={15} />
              </button>
              <button
                type="button"
                title="Hapus Produk"
                onClick={onDelete}
                disabled={isDeleting}
                className="p-2 bg-black/60 backdrop-blur-md text-red-400 hover:text-red-300 rounded-lg hover:bg-black/80 transition flex items-center justify-center text-xs font-bold shadow-sm disabled:opacity-50"
              >
                {isDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
              </button>
            </div>
          )}

          {/* Badge Kategori */}
          <span className="absolute top-3 right-3 z-10 px-3 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-semibold rounded-full">
            {itemCategory}
          </span>

          {/* Badge Jumlah Foto jika lebih dari 1 */}
          {images.length > 1 && (
            <span className="absolute bottom-3 right-3 bg-black/75 text-white backdrop-blur-md text-[10px] font-mono font-bold px-2 py-0.5 rounded-md z-10">
              {activeImageIndex + 1}/{images.length}
            </span>
          )}
        </div>

        {/* Thumbnail Carousel di Bawah Gambar (jika ada multiple images) */}
        {images.length > 1 && (
          <div className="flex gap-2 mt-2 px-3 overflow-x-auto scrollbar-thin">
            {images.map((imgUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                className={`relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0 transition-all ${
                  activeImageIndex === idx
                    ? 'border-2 border-primary ring-2 ring-primary/30 scale-105'
                    : 'border border-neutral-700 opacity-70 hover:opacity-100'
                }`}
              >
                <Image
                  src={imgUrl}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  sizes="40px"
                  className="w-10 h-10 rounded-md object-cover border border-neutral-700"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Konten & Deskripsi */}
      <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
        <div>
          <Link href={`/catalogs/${item.id}`} className="hover:text-primary transition-colors">
            <h3 className="font-bold text-base line-clamp-1">{item.title || 'Item Katalog'}</h3>
          </Link>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {item.description || 'Tidak ada deskripsi tambahan.'}
          </p>
        </div>

        <div className="pt-3 border-t flex justify-between items-center mt-2">
          <div>
            <p className="text-[10px] text-muted-foreground">Harga</p>
            <p className="text-base font-extrabold text-blue-600 dark:text-blue-400 font-mono">
              {formatRupiah(itemPrice)}
            </p>
          </div>
          <div className="text-right">
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                itemStock > 0
                  ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                  : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
              }`}
            >
              {itemStock > 0 ? `Stok: ${itemStock}` : 'Habis'}
            </span>
          </div>
        </div>
      </div>

      {/* Tombol Aksi: Detail & Pesan */}
      <div className="p-4 pt-0 grid grid-cols-2 gap-2">
        <Link
          href={`/catalogs/${item.id}`}
          className="py-2 px-3 border border-border text-center text-xs font-semibold rounded-xl hover:bg-muted transition-colors flex items-center justify-center gap-1.5"
        >
          <Eye size={14} />
          <span>Detail</span>
        </Link>
        <button
          type="button"
          onClick={handleOrderWhatsApp}
          disabled={itemStock <= 0}
          className="py-2 px-3 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <MessageSquare size={14} />
          <span>{itemStock > 0 ? 'Pesan WA' : 'Habis'}</span>
        </button>
      </div>
    </div>
  )
}
