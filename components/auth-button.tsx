import Link from 'next/link'
import { Button } from './ui/button'
import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { LogoutButton } from './logout-button'

export async function AuthButton() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const user = token ? await verifyJWT(token) : null

  let userRole = user?.role?.toString().toLowerCase() || null
  let displayName = user?.name || user?.email || 'User'

  if (user?.id) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true, name: true },
      })
      if (dbUser?.role) {
        userRole = dbUser.role.toString().toLowerCase()
        if (dbUser.name) displayName = dbUser.name
      }
    } catch {
      // Fallback ke token
    }
  }

  return user ? (
    <div className="flex items-center gap-4">
      <span className="text-xs text-muted-foreground">
        Hey, <strong className="text-foreground">{displayName}</strong>!
      </span>
      {userRole === 'admin' || userRole === 'teknisi' ? (
        <Button asChild size="sm" variant="default">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      ) : (
        <Button asChild size="sm" variant="outline">
          <Link href="/tracking">Lacak Servis</Link>
        </Button>
      )}
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant="outline">
        <Link href="/auth/login">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant="default">
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
    </div>
  )
}
