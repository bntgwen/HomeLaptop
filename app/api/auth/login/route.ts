import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signJWT } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Cari user di database Neon
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      )
    }

    // Komparasi password dengan bcryptjs
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      )
    }

    // Pastikan role diambil langsung dari database dalam format lowercase string
    const userRole = user.role ? user.role.toString().toLowerCase() : 'konsumen'

    // Buat token JWT dengan payload lengkap
    const token = await signJWT({
      id: user.id,
      email: user.email,
      name: user.name,
      role: userRole,
    })

    const response = NextResponse.json({
      message: 'Login berhasil',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: userRole,
      },
    })

    // Set cookie HTTP-only bernama 'token' (7 hari)
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 hari
      path: '/',
    })

    return response
  } catch (error: unknown) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Terjadi kesalahan pada server' },
      { status: 500 }
    )
  }
}
