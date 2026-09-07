'use client'

import { useState, useRef } from 'react'
import { createCatalogItemAction } from '@/app/dashboard/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Package, X, UploadCloud } from 'lucide-react'

const CATEGORIES = ['Laptop Bekas', 'Sparepart', 'Aksesoris', 'Komponen']

export function AddCatalogModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Form State
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Laptop Bekas')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('1')
  const [description, setDescription] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setSelectedFiles((prev) => [...prev, ...newFiles])
    setPreviewUrls((prev) => [...prev, ...newPreviews])

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index))
    setPreviewUrls((prev) => {
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
      let uploadedImageUrls: string[] = []

      // 1. Upload semua gambar yang dipilih ke Cloudinary via API Route
      if (selectedFiles.length > 0) {
        const formData = new FormData()
        selectedFiles.forEach((file) => formData.append('files', file))

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || 'Gagal mengunggah foto ke Cloudinary')
        }

        uploadedImageUrls = uploadData.urls || []
      }

      // 2. Simpan ke database Neon via Prisma Server Action
      const numPrice = parseFloat(price.replace(/\D/g, '')) || 0
      const numStock = parseInt(stock, 10) || 0

      const res = await createCatalogItemAction({
        title,
        category,
        price: numPrice,
        stock: numStock,
        description,
        imageUrl: uploadedImageUrls[0] || undefined,
        imageUrls: uploadedImageUrls,
      })

      if (res.success) {
        setSuccessMsg('Produk katalog berhasil ditambahkan ke Neon!')
        setTitle('')
        setPrice('')
        setStock('1')
        setDescription('')
        setSelectedFiles([])
        setPreviewUrls([])

        setTimeout(() => {
          setIsOpen(false)
          setSuccessMsg(null)
        }, 1200)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menambahkan produk katalog')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        size="sm"
        variant="outline"
        className="text-xs h-8 px-3 font-medium bg-background hover:bg-muted border flex items-center gap-1.5"
      >
        <Plus size={14} />
        <span>Tambah Produk</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative z-[101] bg-neutral-900 text-neutral-100 border border-neutral-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Package size={16} />
                </div>
                <h3 className="text-base font-bold">Tambah Produk / Katalog Baru</h3>
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
              {/* Judul Produk */}
              <div className="space-y-1">
                <Label htmlFor="title">Judul / Nama Produk *</Label>
                <Input
                  id="title"
                  required
                  placeholder="Contoh: Asus ZenBook 14 UX425 OLED"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Kategori & Stok */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="category">Kategori *</Label>
                  <select
                    id="category"
                    className="w-full text-sm border rounded-md p-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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

                <div className="space-y-1">
                  <Label htmlFor="stock">Stok Unit *</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                  />
                </div>
              </div>

              {/* Harga */}
              <div className="space-y-1">
                <Label htmlFor="price">Harga (Rp) *</Label>
                <Input
                  id="price"
                  type="text"
                  required
                  placeholder="Contoh: 7500000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              {/* Deskripsi */}
              <div className="space-y-1">
                <Label htmlFor="description">Deskripsi & Spesifikasi</Label>
                <textarea
                  id="description"
                  rows={3}
                  className="w-full text-sm border rounded-md p-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Intel Core i5, RAM 16GB, SSD 512GB, Kondisi 98% Mulus..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Cloudinary Image Uploader */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Foto Produk (Upload ke Cloudinary, Max 5MB/foto)</Label>
                  <span className="text-[11px] text-muted-foreground font-mono font-medium">
                    {previewUrls.length} Foto dipilih
                  </span>
                </div>

                {/* Dropzone / Select button */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-700 rounded-xl p-3 text-center cursor-pointer hover:bg-neutral-800/50 transition-colors bg-neutral-900/50"
                >
                  <div className="space-y-1">
                    <UploadCloud size={24} className="mx-auto text-primary mb-1" />
                    <p className="text-xs font-semibold">Klik untuk Upload Foto ke Cloudinary</p>
                    <p className="text-[10px] text-muted-foreground">PNG, JPEG, atau WEBP hingga 5MB per gambar</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleFilesChange}
                    className="hidden"
                  />
                </div>

                {/* Thumbnail Preview Grid */}
                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
                    {previewUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-lg border border-neutral-800 overflow-hidden group bg-muted/40"
                      >
                        <img
                          src={url}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 bg-black/75 text-[9px] font-bold text-white px-1.5 py-0.5 rounded">
                            Utama
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveFile(idx)
                          }}
                          className="absolute top-1 right-1 bg-red-600/90 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold hover:bg-red-700 shadow-md"
                          title="Hapus foto ini"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tombol Aksi */}
              <div className="pt-3 border-t border-neutral-800 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                  className="w-full sm:w-auto justify-center border-neutral-700 hover:bg-neutral-800 text-neutral-200"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto justify-center bg-primary text-primary-foreground font-semibold"
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
