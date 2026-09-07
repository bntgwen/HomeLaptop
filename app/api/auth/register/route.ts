import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name, phone, role } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar. Silakan login.' },
        { status: 409 }
      )
    }

    // Hash password dengan bcryptjs (salt 10)
    const hashedPassword = await bcrypt.hash(password, 10)

    // Validasi role yang diizinkan
    const assignedRole = role === 'admin' || role === 'teknisi' ? role : 'konsumen'

    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: name?.trim() || null,
        phone: phone?.trim() || null,
        role: assignedRole,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        created_at: true,
      },
    })

    return NextResponse.json(
      {
        message: 'Pendaftaran akun berhasil.',
        user: newUser,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Terjadi kesalahan pada server' },
      { status: 500 }
    )
  }
}
