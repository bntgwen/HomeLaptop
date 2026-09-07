import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { connection } from 'next/server'
import { ProductGallery } from '@/components/product-gallery'
import { ArrowLeft, MessageSquare, Search } from 'lucide-react'

interface ProductDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  await connection()
  const { id } = await params

  if (!id) {
    notFound()
  }

  const product = await prisma.catalog.findUnique({
    where: { id },
  })

  if (!product) {
    notFound()
  }

  const formatRupiah = (val?: number | null) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val ?? 0)
  }

  const displayCategory = product.category === 'Laptop_Bekas' ? 'Laptop Bekas' : (product.category || 'Lainnya')
  const allImages = (product.image_urls && product.image_urls.length > 0)
    ? product.image_urls
    : (product.image_url ? [product.image_url] : [])

  const waMessage = `Halo admin UKK Servis, saya tertarik dengan produk/layanan: "${product.title}" seharga ${formatRupiah(product.price)}.`
  const waUrl = `https://wa.me/?text=${encodeURIComponent(waMessage)}`

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Breadcrumb / Back button */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/catalogs"
              className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Kembali ke Katalog"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link href="/" className="hover:underline">Beranda</Link>
              <span>/</span>
              <Link href="/catalogs" className="hover:underline">Katalog</Link>
              <span>/</span>
              <span className="text-foreground font-semibold line-clamp-1">{product.title}</span>
            </div>
          </div>
        </div>

        {/* Product Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Kolom Kiri: Galeri Foto Cloudinary */}
          <div className="md:col-span-6">
            <ProductGallery images={allImages} title={product.title} />
          </div>

          {/* Kolom Kanan: Informasi Detail Produk */}
          <div className="md:col-span-6 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {displayCategory}
                </span>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    product.stock > 0
                      ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                  }`}
                >
                  {product.stock > 0 ? `Stok: ${product.stock} Unit Tersedia` : 'Stok Habis'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{product.title}</h1>
            </div>

            {/* Price tag */}
            <div className="p-4 rounded-xl bg-muted/30 border space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Harga Penawaran</p>
              <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                {formatRupiah(product.price)}
              </p>
            </div>

            {/* Deskripsi & Spesifikasi */}
            <div className="space-y-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Deskripsi & Spesifikasi
              </h2>
              <div className="p-4 rounded-xl border bg-card text-card-foreground text-sm leading-relaxed whitespace-pre-wrap">
                {product.description || 'Tidak ada deskripsi spesifikasi khusus untuk produk ini.'}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className={`w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-opacity ${
                  product.stock <= 0 ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <MessageSquare size={16} />
                <span>{product.stock > 0 ? 'Pesan & Tanya via WhatsApp' : 'Stok Habis'}</span>
              </a>

              <Link
                href="/tracking"
                className="w-full py-2.5 px-4 border rounded-xl text-xs font-semibold flex items-center justify-center gap-2 hover:bg-muted transition-colors text-center"
              >
                <Search size={14} />
                <span>Sudah servis di toko kami? Lacak Status Servis</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
