import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth'
import { CatalogCategory } from '@prisma/client'

function toPrismaCategory(cat?: string | null): CatalogCategory {
  if (cat === 'Laptop Bekas' || cat === 'Laptop_Bekas') return 'Laptop_Bekas' as CatalogCategory
  if (cat === 'Sparepart') return 'Sparepart' as CatalogCategory
  if (cat === 'Aksesoris') return 'Aksesoris' as CatalogCategory
  if (cat === 'Komponen') return 'Komponen' as CatalogCategory
  return 'Lainnya' as CatalogCategory
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    const user = token ? await verifyJWT(token) : null

    const userRole = user?.role?.toString().toLowerCase()
    if (!user || (userRole !== 'admin' && userRole !== 'teknisi')) {
      return NextResponse.json({ error: 'Unauthorized/Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { title, category, price, stock, description, imageUrl, imageUrls } = body

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const existingProduct = await prisma.catalog.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const primaryImage = imageUrl !== undefined
      ? imageUrl
      : (imageUrls && imageUrls.length > 0 ? imageUrls[0] : existingProduct.image_url)

    const allImages = imageUrls !== undefined
      ? imageUrls
      : (primaryImage ? [primaryImage] : existingProduct.image_urls)

    const updatedProduct = await prisma.catalog.update({
      where: { id },
      data: {
        title: title ? title.trim() : existingProduct.title,
        category: category ? toPrismaCategory(category) : existingProduct.category,
        price: price !== undefined ? Number(price) : existingProduct.price,
        stock: stock !== undefined ? Number(stock) : existingProduct.stock,
        description: description !== undefined ? (description?.trim() || null) : existingProduct.description,
        image_url: primaryImage,
        image_urls: allImages,
      },
    })

    return NextResponse.json({
      success: true,
      product: updatedProduct,
    })
  } catch (error: unknown) {
    console.error('PATCH /api/products/[id] error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
