import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { LogoutButton } from '@/components/logout-button'
import Link from 'next/link'
import { User, ArrowLeft, LayoutDashboard, Search } from 'lucide-react'

export default async function AccountPage() {
  await connection()
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    redirect('/auth/login?redirectTo=/account')
  }

  const payload = await verifyJWT(token)
  if (!payload) {
    redirect('/auth/login?redirectTo=/account')
  }

  let dbUser = null
  try {
    dbUser = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        created_at: true,
      },
    })
  } catch {
    // Fallback
  }

  const user = dbUser || {
    id: payload.id,
    email: payload.email,
    name: payload.name || 'User',
    role: payload.role || 'user',
    phone: null,
    created_at: null,
  }

  const userRole = user.role?.toString().toLowerCase() || 'user'
  const isStaff = userRole === 'admin' || userRole === 'teknisi'

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-xl space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Kembali ke Beranda"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Akun Saya</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Informasi profil dan pengaturan akun</p>
            </div>
          </div>
        </div>

        {/* Card Profil */}
        <div className="border rounded-2xl bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl border border-primary/20">
              {user.name ? user.name[0].toUpperCase() : <User size={24} />}
            </div>
            <div>
              <h2 className="font-bold text-lg">{user.name || 'Pengguna'}</h2>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              <div className="mt-1.5 flex gap-2">
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 capitalize">
                  Role: {userRole}
                </span>
                {isStaff && (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Staf Teknis
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t text-sm">
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground text-xs">ID Akun</span>
              <span className="font-mono text-xs text-foreground/80">{user.id}</span>
            </div>
            {user.phone && (
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground text-xs">Nomor Telepon</span>
                <span className="text-xs font-medium">{user.phone}</span>
              </div>
            )}
          </div>

          {/* Quick Shortcuts */}
          <div className="pt-4 border-t space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {isStaff ? (
                <Link
                  href="/dashboard"
                  className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <LayoutDashboard size={16} />
                  <span>Dashboard</span>
                </Link>
              ) : (
                <Link
                  href="/tracking"
                  className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <Search size={16} />
                  <span>Lacak Servis</span>
                </Link>
              )}

              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
