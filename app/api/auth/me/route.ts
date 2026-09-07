import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  const payload = await verifyJWT(token)
  if (!payload) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  // Ambil role terbaru dari database Neon agar selalu up-to-date jika role diubah di Neon DB
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, name: true, role: true },
    })

    if (dbUser) {
      const userRole = dbUser.role ? dbUser.role.toString().toLowerCase() : 'konsumen'
      return NextResponse.json({
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: userRole,
        },
      })
    }
  } catch {
    // Fallback ke data payload token jika ada gangguan jaringan
  }

  const payloadRole = payload.role ? payload.role.toString().toLowerCase() : 'konsumen'
  return NextResponse.json({
    user: {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payloadRole,
    },
  })
}
