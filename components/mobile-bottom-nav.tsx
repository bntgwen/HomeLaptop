'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Wrench, LayoutDashboard, User } from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
  exact?: boolean
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Ambil data user role saat component dimount
  useEffect(() => {
    let isMounted = true
    async function fetchUserRole() {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          if (isMounted && data.user?.role) {
            setRole(data.user.role.toString().toLowerCase())
          }
        }
      } catch {
        // Guest / error fetching
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchUserRole()
    return () => {
      isMounted = false
    }
  }, [pathname])

  const isStaff = role === 'admin' || role === 'teknisi'

  // Definisi Item Navigasi Berdasarkan Role
  const navItems: NavItem[] = isStaff
    ? [
        {
          name: 'Home',
          href: '/',
          icon: <Home size={22} />,
          exact: true,
        },
        {
          name: 'Services',
          href: '/tracking',
          icon: <Wrench size={22} />,
        },
        {
          name: 'Dashboard',
          href: '/dashboard',
          icon: <LayoutDashboard size={22} />,
        },
        {
          name: 'Account',
          href: '/account',
          icon: <User size={22} />,
        },
      ]
    : [
        {
          name: 'Home',
          href: '/',
          icon: <Home size={22} />,
          exact: true,
        },
        {
          name: 'Services',
          href: '/tracking',
          icon: <Wrench size={22} />,
        },
        {
          name: 'Account',
          href: '/account',
          icon: <User size={22} />,
        },
      ]

  const checkIsActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href
    }
    return pathname.startsWith(item.href)
  }

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-full py-2 px-4 shadow-2xl block md:hidden transition-all"
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = checkIsActive(item)

          return (
            <Link
              key={item.name}
              href={item.href}
              className="group relative flex flex-col items-center justify-center p-2 transition-all rounded-full"
            >
              {/* Tooltip melayang di atas icon */}
              <span className="absolute -top-9 scale-0 group-hover:scale-100 group-active:scale-100 transition-all duration-200 bg-neutral-800 text-white text-[10px] font-semibold py-1 px-2.5 rounded-md shadow-lg pointer-events-none whitespace-nowrap border border-neutral-700">
                {item.name}
              </span>

              {/* Icon dengan Active State styling */}
              <div
                className={`transition-all duration-200 ${
                  isActive
                    ? 'text-primary scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                    : 'text-neutral-400 group-hover:text-neutral-200'
                }`}
              >
                {item.icon}
              </div>

              {/* Titik indikator kecil di bawah icon untuk active state */}
              {isActive && (
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1 animate-pulse" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
