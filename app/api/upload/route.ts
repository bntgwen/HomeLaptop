import { NextResponse } from 'next/server'
import { uploadImageToCloudinary } from '@/lib/cloudinary'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const singleFile = formData.get('file') as File | null

    const allFiles: File[] = []
    if (files && files.length > 0) {
      allFiles.push(...files)
    } else if (singleFile) {
      allFiles.push(singleFile)
    }

    if (allFiles.length === 0) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah' }, { status: 400 })
    }

    const uploadedUrls: string[] = []

    for (const file of allFiles) {
      if (!file.type.startsWith('image/')) {
        continue
      }
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const result = await uploadImageToCloudinary(buffer, 'ukk-app/catalogs')
      uploadedUrls.push(result.url)
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      url: uploadedUrls[0] || null,
    })
  } catch (error: unknown) {
    console.error('Cloudinary upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal mengunggah gambar ke Cloudinary' },
      { status: 500 }
    )
  }
}
