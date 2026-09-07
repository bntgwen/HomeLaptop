'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Wrench, LayoutDashboard, User, ShoppingBag } from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
  exact?: boolean
}

export function FloatingBottomNav() {
  const pathname = usePathname()
  const [role, setRole] = useState<string | null>(null)

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
        // Guest
      }
    }

    fetchUserRole()
    return () => {
      isMounted = false
    }
  }, [pathname])

  const isStaff = role === 'admin' || role === 'teknisi'
  const isGuest = !role

  // Menu items:
  // 1. Guest (Belum login): Hanya 2 menu (Home, Services/Tracking)
  // 2. User Biasa (Logged in): 4 menu (Home, Services/Tracking, Catalog, Account)
  // 3. Admin / Teknisi: 4 menu (Home, Services/Tracking, Dashboard, Account)
  let navItems: NavItem[] = []

  if (isGuest) {
    navItems = [
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
    ]
  } else if (isStaff) {
    navItems = [
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
  } else {
    // User Biasa (Konsumen)
    navItems = [
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
        name: 'Catalog',
        href: '/catalogs',
        icon: <ShoppingBag size={22} />,
      },
      {
        name: 'Account',
        href: '/account',
        icon: <User size={22} />,
      },
    ]
  }

  const checkIsActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href
    }
    return pathname.startsWith(item.href)
  }

  return (
    <nav
      aria-label="Universal Navigation"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center gap-4 sm:gap-6 pointer-events-auto"
    >
      {navItems.map((item) => {
        const isActive = checkIsActive(item)

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`relative flex items-center justify-center w-12 h-12 rounded-full bg-neutral-900 border ${
              isActive
                ? 'border-primary text-primary'
                : 'border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {/* Icon */}
            <div>
              {item.icon}
            </div>
          </Link>
        )
      })}
    </nav>
  )
}
