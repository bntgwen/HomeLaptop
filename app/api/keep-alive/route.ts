import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Lakukan query paling ringan ke Prisma/Neon
    await prisma.user.findFirst({ select: { id: true } })
    return NextResponse.json({ status: 'healthy', timestamp: new Date().toISOString() })
  } catch (error: unknown) {
    return NextResponse.json(
      { status: 'error', message: 'Database ping failed', error: error instanceof Error ? error.message : undefined },
      { status: 500 }
    )
  }
}
