'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const logout = async () => {
    try {
      setIsPending(true)
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
      router.refresh()
    } catch {
      router.push('/')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={logout}
      disabled={isPending}
      className="w-full sm:w-auto flex items-center justify-center gap-2 border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-600"
    >
      <LogOut size={16} />
      <span>{isPending ? 'Keluar...' : 'Logout'}</span>
    </Button>
  )
}
