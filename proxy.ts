import { NextResponse, type NextRequest } from 'next/server'
import { verifyJWT } from '@/lib/auth'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 0. Biarkan route keep-alive bebas diakses tanpa token
  if (pathname.startsWith('/api/keep-alive')) {
    return NextResponse.next()
  }

  const token = request.cookies.get('token')?.value

  // Verifikasi JWT token langsung di Edge runtime
  const user = token ? await verifyJWT(token) : null
  const userRole = user?.role ? user.role.toString().toLowerCase() : null

  const isProtectedPath =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/protected') ||
    pathname.startsWith('/catalogs') ||
    pathname.startsWith('/catalog') ||
    pathname.startsWith('/account') ||
    pathname.startsWith('/profile')

  const isAuthPath = pathname === '/auth/login' || pathname === '/auth/sign-up' || pathname === '/login' || pathname === '/register'

  // 1. Jika mengakses route terproteksi (/dashboard /protected /catalogs /account)
  if (isProtectedPath) {
    if (!user) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/auth/login'
      loginUrl.searchParams.set('redirectTo', pathname)
      loginUrl.searchParams.set('message', 'Silakan login terlebih dahulu')
      return NextResponse.redirect(loginUrl)
    }

    // Role Guard case-insensitive: Hanya admin & teknisi yang diizinkan masuk ke /dashboard
    if (pathname.startsWith('/dashboard') && userRole !== 'admin' && userRole !== 'teknisi') {
      const trackingUrl = request.nextUrl.clone()
      trackingUrl.pathname = '/tracking'
      return NextResponse.redirect(trackingUrl)
    }
  }

  // 2. Jika sudah login dan mengunjungi halaman auth, arahkan ke dashboard/tracking
  if (isAuthPath && user) {
    const targetUrl = request.nextUrl.clone()
    targetUrl.pathname = (userRole === 'admin' || userRole === 'teknisi') ? '/dashboard' : '/tracking'
    return NextResponse.redirect(targetUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/keep-alive
     * - image extensions (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/keep-alive|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
