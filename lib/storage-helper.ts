import { createClient } from '@/lib/supabase/client'

/**
 * Upload gambar katalog ke Supabase Storage bucket 'catalog-images'
 * @param file Berkas gambar (File)
 * @param customPath Path/nama berkas opsional
 * @returns public URL gambar yang dapat diakses langsung
 */
export async function uploadCatalogImage(file: File, customPath?: string): Promise<string> {
  const supabase = createClient()

  // Validasi tipe file
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Tipe berkas tidak didukung! Gunakan format PNG, JPEG, atau WEBP.')
  }

  // Validasi ukuran maksimal (2MB)
  const maxSizeInBytes = 2 * 1024 * 1024
  if (file.size > maxSizeInBytes) {
    throw new Error('Ukuran berkas melebihi batas maksimal 2MB!')
  }

  // Generate unique file path
  const fileExt = file.name.split('.').pop() || 'png'
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
  const filePath = customPath ? `${customPath}/${fileName}` : fileName

  // Upload ke Supabase Storage bucket 'catalog-images'
  const { data, error } = await supabase.storage
    .from('catalog-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw new Error(`Gagal mengunggah gambar ke Storage: ${error.message}`)
  }

  // Dapatkan public URL
  const { data: publicUrlData } = supabase.storage
    .from('catalog-images')
    .getPublicUrl(data.path)

  return publicUrlData.publicUrl
}

/**
 * Upload beberapa gambar katalog sekaligus menggunakan Promise.all
 * @param files Array berkas gambar
 * @returns Array string public URLs
 */
export async function uploadMultipleCatalogImages(files: File[]): Promise<string[]> {
  if (!files || files.length === 0) return []
  return Promise.all(files.map((file) => uploadCatalogImage(file)))
}

/**
 * Hapus gambar katalog dari Supabase Storage berdasarkan public URL atau path
 * @param imageUrl URL lengkap atau nama file di storage
 */
export async function deleteCatalogImageFromStorage(imageUrl?: string | null): Promise<void> {
  if (!imageUrl) return

  const supabase = createClient()

  try {
    // Ekstrak nama file dari URL (misalnya /catalog-images/1712345678-abc.jpg atau url langsung)
    let fileName = imageUrl
    if (imageUrl.includes('/catalog-images/')) {
      const parts = imageUrl.split('/catalog-images/')
      fileName = parts[parts.length - 1]
    } else if (imageUrl.includes('/')) {
      const urlObj = new URL(imageUrl)
      const pathParts = urlObj.pathname.split('/')
      fileName = pathParts[pathParts.length - 1]
    }

    if (fileName) {
      await supabase.storage.from('catalog-images').remove([fileName])
    }
  } catch (err) {
    console.warn('Gagal menghapus gambar dari storage (diabaikan jika file tidak ada):', err)
  }
}

/**
 * Hapus banyak gambar katalog dari Supabase Storage sekaligus
 * @param imageUrls Array URL gambar
 */
export async function deleteMultipleCatalogImagesFromStorage(imageUrls: string[]): Promise<void> {
  if (!imageUrls || imageUrls.length === 0) return
  await Promise.all(imageUrls.map((url) => deleteCatalogImageFromStorage(url)))
}


