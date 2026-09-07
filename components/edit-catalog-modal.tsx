'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { Pencil, X, UploadCloud } from 'lucide-react'

const CATEGORIES = ['Laptop Bekas', 'Sparepart', 'Aksesoris', 'Komponen']

export interface CatalogItemData {
  id: string
  title: string
  category?: string | null
  price?: number | null
  stock?: number | null
  description?: string | null
  image_url?: string | null
  image_urls?: string[] | null
}

interface EditCatalogModalProps {
  product: CatalogItemData
  trigger?: React.ReactNode
  isOpen?: boolean
  onClose?: () => void
}

export function EditCatalogModal({ product, trigger, isOpen: controlledIsOpen, onClose }: EditCatalogModalProps) {
  const router = useRouter()
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const isModalOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen

  const setModalOpen = (open: boolean) => {
    if (controlledIsOpen !== undefined) {
      if (!open && onClose) onClose()
    } else {
      setInternalIsOpen(open)
    }
  }

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Form State dengan pre-filled data
  const [title, setTitle] = useState(product.title || '')
  const [category, setCategory] = useState(product.category === 'Laptop_Bekas' ? 'Laptop Bekas' : (product.category || 'Laptop Bekas'))
  const [price, setPrice] = useState(product.price?.toString() || '0')
  const [stock, setStock] = useState(product.stock?.toString() || '1')
  const [description, setDescription] = useState(product.description || '')

  // Gambar yang sudah ada
  const initialImages = (product.image_urls && product.image_urls.length > 0)
    ? product.image_urls
    : (product.image_url ? [product.image_url] : [])
  const [existingImages, setExistingImages] = useState<string[]>(initialImages)

  // File baru yang dipilih untuk diunggah
  const [selectedNewFiles, setSelectedNewFiles] = useState<File[]>([])
  const [newPreviewUrls, setNewPreviewUrls] = useState<string[]>([])

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const resetFormFromProduct = () => {
    setTitle(product.title || '')
    setCategory(product.category === 'Laptop_Bekas' ? 'Laptop Bekas' : (product.category || 'Laptop Bekas'))
    setPrice(product.price?.toString() || '0')
    setStock(product.stock?.toString() || '1')
    setDescription(product.description || '')
    const currentImgs = (product.image_urls && product.image_urls.length > 0)
      ? product.image_urls
      : (product.image_url ? [product.image_url] : [])
    setExistingImages(currentImgs)
    setSelectedNewFiles([])
    setNewPreviewUrls([])
    setError(null)
    setSuccessMsg(null)
  }

  const handleOpen = () => {
    resetFormFromProduct()
    setModalOpen(true)
  }

  useEffect(() => {
    if (isModalOpen) {
      resetFormFromProduct()
    }
  }, [isModalOpen, product])

  const handleNewFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newFiles: File[] = []
    const newPreviews: string[] = []
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!allowed.includes(file.type)) {
        setError(`Format "${file.name}" tidak didukung. Gunakan PNG, JPEG, atau WEBP.`)
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`Ukuran berkas "${file.name}" melebihi 5MB!`)
        return
      }
      newFiles.push(file)
      newPreviews.push(URL.createObjectURL(file))
    }

    setError(null)
    setSelectedNewFiles((prev) => [...prev, ...newFiles])
    setNewPreviewUrls((prev) => [...prev, ...newPreviews])

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveExistingImage = (imageUrl: string) => {
    setExistingImages((prev) => prev.filter((img) => img !== imageUrl))
  }

  const handleRemoveNewFile = (index: number) => {
    setSelectedNewFiles((prev) => prev.filter((_, idx) => idx !== index))
    setNewPreviewUrls((prev) => {
      const updated = [...prev]
      URL.revokeObjectURL(updated[index])
      return updated.filter((_, idx) => idx !== index)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      // 1. Upload semua berkas baru yang ditambahkan ke Cloudinary jika ada
      let uploadedNewUrls: string[] = []
      if (selectedNewFiles.length > 0) {
        const formData = new FormData()
        selectedNewFiles.forEach((file) => formData.append('files', file))

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || 'Gagal mengunggah foto ke Cloudinary')
        }

        uploadedNewUrls = uploadData.urls || []
      }

      // Gabungkan gambar lama yang dipertahankan + gambar baru dari Cloudinary
      const finalImageUrls = [...existingImages, ...uploadedNewUrls]
      const primaryImageUrl = finalImageUrls[0] || null

      // 2. Simpan update ke database Neon melalui PATCH API Route
      const numPrice = parseFloat(price.replace(/\D/g, '')) || 0
      const numStock = parseInt(stock, 10) || 0

      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          price: numPrice,
          stock: numStock,
          description,
          imageUrl: primaryImageUrl,
          imageUrls: finalImageUrls,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memperbarui produk katalog')
      }

      setSuccessMsg('Katalog berhasil diperbarui di database Neon!')
      router.refresh()

      setTimeout(() => {
        setModalOpen(false)
        setSuccessMsg(null)
      }, 1000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui produk katalog')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {trigger && (
        <div onClick={handleOpen} className="inline-block cursor-pointer">
          {trigger}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative z-[101] bg-neutral-900 text-neutral-100 border border-neutral-800 rounded-2xl shadow-2xl max-w-4xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Pencil size={16} />
                </div>
                <h3 className="text-lg font-bold">Edit Item Produk / Katalog</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
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

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 2 Kolom Grid Layout: Kiri Gambar, Kanan Form Input */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Kolom Kiri (5 kolom di Desktop): Area Preview & Upload Foto */}
                <div className="md:col-span-5 space-y-4 bg-neutral-950/60 p-4 rounded-xl border border-neutral-800">
                  <div className="flex justify-between items-center">
                    <Label className="font-semibold text-xs">Foto Produk (Cloudinary)</Label>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {existingImages.length + newPreviewUrls.length} Foto
                    </span>
                  </div>

                  {/* Dropzone Upload Foto Baru */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-neutral-700 rounded-xl p-4 text-center cursor-pointer hover:bg-neutral-800/60 transition-colors bg-neutral-900/50"
                  >
                    <UploadCloud size={28} className="mx-auto mb-1 text-primary" />
                    <p className="text-xs font-semibold">Upload Foto Tambahan</p>
                    <p className="text-[10px] text-muted-foreground">PNG, JPG, WEBP hingga 5MB</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={handleNewFilesChange}
                      className="hidden"
                    />
                  </div>

                  {/* Grid Galeri Gambar Terunggah */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-medium text-muted-foreground">Galeri Gambar Saat Ini:</p>
                    {existingImages.length === 0 && newPreviewUrls.length === 0 ? (
                      <div className="p-6 text-center text-xs text-muted-foreground border border-neutral-800 rounded-lg bg-neutral-900">
                        Belum ada gambar yang diunggah.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
                        {/* Gambar Lama */}
                        {existingImages.map((url, idx) => (
                          <div
                            key={`existing-${idx}`}
                            className="relative aspect-square rounded-lg border border-neutral-800 overflow-hidden group bg-muted/40"
                          >
                            <Image
                              src={url}
                              alt={`Existing ${idx + 1}`}
                              fill
                              sizes="120px"
                              className="object-cover"
                            />
                            {idx === 0 && (
                              <span className="absolute bottom-1 left-1 bg-black/75 text-[9px] font-bold text-white px-1.5 py-0.5 rounded z-10">
                                Utama
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveExistingImage(url)
                              }}
                              className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold hover:bg-red-700 shadow-md z-10"
                              title="Hapus foto ini"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}

                        {/* Preview Gambar Baru */}
                        {newPreviewUrls.map((url, idx) => (
                          <div
                            key={`new-${idx}`}
                            className="relative aspect-square rounded-lg border-2 border-primary overflow-hidden group bg-muted/40"
                          >
                            <Image
                              src={url}
                              alt={`New ${idx + 1}`}
                              fill
                              sizes="120px"
                              className="object-cover"
                            />
                            <span className="absolute bottom-1 left-1 bg-primary text-[9px] font-bold text-primary-foreground px-1.5 py-0.5 rounded z-10">
                              Baru
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveNewFile(idx)
                              }}
                              className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold hover:bg-red-700 shadow-md z-10"
                              title="Batalkan foto ini"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Kolom Kanan (7 kolom di Desktop): Form Input */}
                <div className="md:col-span-7 space-y-4">
                  {/* Judul Produk */}
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-title">Nama / Judul Produk *</Label>
                    <Input
                      id="edit-title"
                      required
                      placeholder="Contoh: Asus ZenBook 14 UX425 OLED"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  {/* Kategori & Stok */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-category">Kategori *</Label>
                      <select
                        id="edit-category"
                        className="w-full text-sm border rounded-md p-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="edit-stock">Stok Unit *</Label>
                      <Input
                        id="edit-stock"
                        type="number"
                        min="0"
                        required
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Harga */}
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-price">Harga (Rp) *</Label>
                    <Input
                      id="edit-price"
                      type="text"
                      required
                      placeholder="Contoh: 7500000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>

                  {/* Deskripsi & Spesifikasi */}
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-description">Deskripsi & Spesifikasi Lengkap</Label>
                    <textarea
                      id="edit-description"
                      rows={5}
                      className="w-full text-sm border rounded-md p-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
                      placeholder="Intel Core i5, RAM 16GB, SSD 512GB, Layar OLED, Baterai awet 95%..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>

              </div>

              {/* Tombol Aksi Footer */}
              <div className="pt-4 border-t border-neutral-800 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  disabled={isLoading}
                  className="w-full sm:w-auto justify-center border-neutral-700 hover:bg-neutral-800 text-neutral-200"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto justify-center px-6 bg-primary text-primary-foreground hover:opacity-90 font-semibold"
                >
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
