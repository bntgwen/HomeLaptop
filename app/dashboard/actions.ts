'use server'

import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { verifyJWT } from '@/lib/auth'
import { ServiceStatus as PrismaServiceStatus } from '@prisma/client'

export type ServiceStatus =
  | 'Diterima'
  | 'Pengecekan'
  | 'Perbaikan'
  | 'Selesai'
  | 'Pending'
  | 'Diproses'
  | 'Bisa Diambil'
  | 'Batal'

export type CatalogCategory = 'Laptop_Bekas' | 'Sparepart' | 'Aksesoris' | 'Komponen' | 'Lainnya'

function toPrismaStatus(status: ServiceStatus | string): PrismaServiceStatus {
  if (status === 'Bisa Diambil') return 'Bisa_Diambil' as PrismaServiceStatus
  return status as PrismaServiceStatus
}

function toPrismaCategory(cat?: string | null): CatalogCategory {
  if (cat === 'Laptop Bekas') return 'Laptop_Bekas'
  if (cat === 'Sparepart') return 'Sparepart'
  if (cat === 'Aksesoris') return 'Aksesoris'
  if (cat === 'Komponen') return 'Komponen'
  return 'Lainnya'
}

async function checkAuthAndRole() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    throw new Error('Unauthorized: Harap login terlebih dahulu.')
  }

  const payload = await verifyJWT(token)
  if (!payload) {
    throw new Error('Unauthorized: Sesi tidak valid atau telah kedaluwarsa.')
  }

  const role = payload.role

  if (role !== 'admin' && role !== 'teknisi') {
    throw new Error('Forbidden: Anda tidak memiliki hak akses teknis.')
  }

  return { user: payload, role }
}

/**
 * Update Status Pengerjaan Servis dan/atau log sparepart (Dapat diakses Admin & Teknisi)
 */
export async function updateServiceStatusAction(
  serviceId: string,
  newStatus: ServiceStatus,
  statusNote?: string,
  sparepartId?: string,
  sparepartQty?: number
) {
  await checkAuthAndRole()

  const prismaStatus = toPrismaStatus(newStatus)

  // 1. Update status pada tabel services
  await prisma.service.update({
    where: { id: serviceId },
    data: {
      status: prismaStatus,
    },
  })

  // 2. Tambah Service Log (Jika ada sparepart atau catatan khusus tambahan)
  if (sparepartId && sparepartQty && sparepartQty > 0) {
    await prisma.serviceLog.create({
      data: {
        service_id: serviceId,
        status_stage: prismaStatus,
        status_note: statusNote || `Penggunaan sparepart pada tahap ${newStatus}`,
        sparepart_used_id: sparepartId,
        sparepart_qty: sparepartQty,
      },
    })
  }

  revalidatePath('/dashboard')
  revalidatePath('/tracking')
  return { success: true }
}

/**
 * Update Detail Tiket Servis Penuh (Status, Perangkat, Keluhan, Teknisi, Items / Kalkulasi Total Biaya)
 */
export async function updateServiceTicketAction(formData: {
  serviceId: string
  deviceName: string
  issueDescription: string
  status: ServiceStatus
  technicianId?: string | null
  statusNote?: string
  items?: {
    catalog_id: string
    item_name: string
    price: number
    quantity: number
  }[]
}) {
  await checkAuthAndRole()

  const prismaStatus = toPrismaStatus(formData.status)

  // 1. Update data pada tabel services
  await prisma.service.update({
    where: { id: formData.serviceId },
    data: {
      device_name: formData.deviceName,
      issue_description: formData.issueDescription,
      status: prismaStatus,
      technician_id: formData.technicianId || null,
    },
  })

  // 2. Sinkronisasi Ticket Items jika dikirim
  if (formData.items !== undefined) {
    await prisma.ticketItem.deleteMany({
      where: { ticket_id: formData.serviceId },
    })

    if (formData.items.length > 0) {
      await prisma.ticketItem.createMany({
        data: formData.items.map((item) => ({
          ticket_id: formData.serviceId,
          catalog_id: item.catalog_id || null,
          item_name: item.item_name,
          price: item.price,
          quantity: item.quantity,
        })),
      })
    }
  }

  // 3. Tambah catatan log jika disediakan
  if (formData.statusNote) {
    await prisma.serviceLog.create({
      data: {
        service_id: formData.serviceId,
        status_stage: prismaStatus,
        status_note: formData.statusNote,
      },
    })
  }

  revalidatePath('/dashboard')
  revalidatePath('/tracking')
  return { success: true }
}

/**
 * Hapus Tiket Servis Penuh (Khusus Admin)
 */
export async function deleteServiceTicketAction(serviceId: string) {
  const { role } = await checkAuthAndRole()

  if (role !== 'admin') {
    throw new Error('Forbidden: Hanya Admin yang dapat menghapus data tiket servis.')
  }

  await prisma.service.delete({
    where: { id: serviceId },
  })

  revalidatePath('/dashboard')
  revalidatePath('/tracking')
  return { success: true }
}

/**
 * Tambah Transaksi Servis Baru (Khusus Admin [FR-02]) dengan rincian item/katalog
 */
export async function createServiceAction(formData: {
  customerName: string
  customerPhone: string
  customerAddress?: string
  deviceName: string
  issueDescription: string
  technicianId?: string
  items?: {
    catalog_id: string
    item_name: string
    price: number
    quantity: number
  }[]
}) {
  const { role } = await checkAuthAndRole()

  if (role !== 'admin') {
    throw new Error('Forbidden: Hanya Admin yang dapat mendaftarkan transaksi servis baru.')
  }

  // 1. Buat atau cari Customer berdasarkan nomor telepon
  let customer = await prisma.customer.findUnique({
    where: { phone: formData.customerPhone },
  })

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        name: formData.customerName,
        phone: formData.customerPhone,
        address: formData.customerAddress || null,
      },
    })
  }

  // 2. Generate custom ticket code
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
  const customTicketCode = `TCK-${dateStr}-${randomSuffix}`

  // 3. Simpan data Service baru
  const newService = await prisma.service.create({
    data: {
      ticket_code: customTicketCode,
      customer_id: customer.id,
      technician_id: formData.technicianId || null,
      device_name: formData.deviceName,
      issue_description: formData.issueDescription,
      status: 'Diterima',
    },
    select: {
      id: true,
      ticket_code: true,
    },
  })

  // 4. Simpan Rincian Item Katalog (ticket_items & initial service_logs)
  if (formData.items && formData.items.length > 0) {
    await prisma.ticketItem.createMany({
      data: formData.items.map((item) => ({
        ticket_id: newService.id,
        catalog_id: item.catalog_id || null,
        item_name: item.item_name,
        price: item.price,
        quantity: item.quantity,
      })),
    })

    for (const item of formData.items) {
      await prisma.serviceLog.create({
        data: {
          service_id: newService.id,
          status_stage: 'Diterima',
          status_note: `Pemilihan item awal: ${item.item_name} (${item.quantity}x)`,
          sparepart_used_id: item.catalog_id || null,
          sparepart_qty: item.quantity,
        },
      })
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/tracking')
  return { success: true, service: newService }
}

/**
 * Tambah Item Katalog / Produk Baru (Khusus Admin [FR-07])
 */
export async function createCatalogItemAction(formData: {
  title: string
  category?: 'Laptop Bekas' | 'Sparepart' | 'Aksesoris' | 'Komponen' | string
  price: number
  stock?: number
  description?: string
  imageUrl?: string
  imageUrls?: string[]
}) {
  const { role } = await checkAuthAndRole()

  if (role !== 'admin') {
    throw new Error('Forbidden: Hanya Admin yang dapat menambahkan produk/katalog.')
  }

  const primaryImage = formData.imageUrl || (formData.imageUrls && formData.imageUrls.length > 0 ? formData.imageUrls[0] : null)
  const allImages = formData.imageUrls && formData.imageUrls.length > 0 ? formData.imageUrls : (primaryImage ? [primaryImage] : [])

  const newCatalog = await prisma.catalog.create({
    data: {
      title: formData.title.trim(),
      category: toPrismaCategory(formData.category),
      price: formData.price || 0,
      stock: formData.stock !== undefined ? formData.stock : 1,
      description: formData.description?.trim() || null,
      image_url: primaryImage,
      image_urls: allImages,
    },
    select: {
      id: true,
      title: true,
    },
  })

  revalidatePath('/dashboard')
  revalidatePath('/catalogs')
  revalidatePath('/')
  return { success: true, product: newCatalog }
}

/**
 * Hapus Item Katalog (Khusus Admin & Teknisi)
 */
export async function deleteCatalogItemAction(catalogId: string) {
  const { role } = await checkAuthAndRole()

  if (role !== 'admin' && role !== 'teknisi') {
    throw new Error('Forbidden: Anda tidak memiliki wewenang menghapus item katalog.')
  }

  await prisma.catalog.delete({
    where: { id: catalogId },
  })

  revalidatePath('/dashboard')
  revalidatePath('/catalogs')
  revalidatePath('/')
  return { success: true }
}

/**
 * Edit / Update Item Katalog (Khusus Admin & Teknisi)
 */
export async function updateCatalogItemAction(formData: {
  id: string
  title: string
  category?: 'Laptop Bekas' | 'Sparepart' | 'Aksesoris' | 'Komponen' | string
  price: number
  stock?: number
  description?: string
  imageUrl?: string | null
  imageUrls?: string[]
}) {
  const { role } = await checkAuthAndRole()

  if (role !== 'admin' && role !== 'teknisi') {
    throw new Error('Forbidden: Anda tidak memiliki wewenang mengubah item katalog.')
  }

  const primaryImage = formData.imageUrl !== undefined
    ? formData.imageUrl
    : (formData.imageUrls && formData.imageUrls.length > 0 ? formData.imageUrls[0] : null)
  
  const allImages = formData.imageUrls !== undefined
    ? formData.imageUrls
    : (primaryImage ? [primaryImage] : [])

  const updatedCatalog = await prisma.catalog.update({
    where: { id: formData.id },
    data: {
      title: formData.title.trim(),
      category: toPrismaCategory(formData.category),
      price: formData.price || 0,
      stock: formData.stock !== undefined ? formData.stock : 1,
      description: formData.description?.trim() || null,
      image_url: primaryImage,
      image_urls: allImages,
    },
    select: {
      id: true,
      title: true,
    },
  })

  revalidatePath('/dashboard')
  revalidatePath('/catalogs')
  revalidatePath('/')
  return { success: true, product: updatedCatalog }
}
