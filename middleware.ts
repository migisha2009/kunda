import { NextRequest, NextResponse } from 'next/server'
import type { NextFetchEvent } from 'next/server'

export function middleware(request: NextRequest, _event: NextFetchEvent) {
  const { pathname } = request.nextUrl
  
  // Get the role from cookie
  const role = request.cookies.get('kunda-role')?.value as 'couple' | 'vendor' | 'admin' | null

  // Guest routes that don't require authentication
  const isGuestRoute = pathname.startsWith('/guest')

  // Protected routes that require authentication
  const isDashboardRoute = pathname.startsWith('/dashboard')
  const isCoupleRoute = pathname.startsWith('/dashboard/couple')
  const isVendorRoute = pathname.startsWith('/dashboard/vendor')
  const isAdminRoute = pathname.startsWith('/dashboard/admin')

  // Skip authentication for guest routes
  if (isGuestRoute) {
    return NextResponse.next()
  }

  // If trying to access dashboard routes
  if (isDashboardRoute) {
    // If not authenticated, redirect to login
    if (!role) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // If trying to access admin routes but not an admin
    if (isAdminRoute && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard/couple', request.url))
    }

    // If trying to access couple routes but not a couple
    if (isCoupleRoute && role !== 'couple') {
      return NextResponse.redirect(new URL('/dashboard/vendor', request.url))
    }

    // If trying to access vendor routes but not a vendor
    if (isVendorRoute && role !== 'vendor') {
      return NextResponse.redirect(new URL('/dashboard/couple', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
