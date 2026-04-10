import { NextRequest, NextResponse } from 'next/server'
import type { NextFetchEvent } from 'next/server'

export function middleware(request: NextRequest, _event: NextFetchEvent) {
  const { pathname } = request.nextUrl
  
  // Get the role from cookie
  const role = request.cookies.get('kunda-role')?.value as 'couple' | 'vendor' | 'admin' | null

  // Define protected routes
  const isAdminRoute = pathname.startsWith('/dashboard/admin')
  const isVendorRoute = pathname.startsWith('/dashboard/vendor')
  const isCoupleRoute = pathname.startsWith('/dashboard/couple')
  const isDashboardRoute = pathname.startsWith('/dashboard')
  const isLoginRoute = pathname === '/login'
  const isSignupRoute = pathname === '/signup'

  // Handle login/signup redirects for authenticated users
  if ((isLoginRoute || isSignupRoute) && role) {
    // Redirect to appropriate dashboard based on role
    const dashboardUrl = new URL(`/dashboard/${role}`, request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  // Handle dashboard routes protection
  if (isDashboardRoute) {
    // If not authenticated, redirect to login
    if (!role) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // CRITICAL FIX: Only redirect if role doesn't match the route
    // If user is on the correct dashboard for their role, let them through
    if (isAdminRoute && role === 'admin') {
      return NextResponse.next()
    }
    
    if (isVendorRoute && role === 'vendor') {
      return NextResponse.next()
    }
    
    if (isCoupleRoute && role === 'couple') {
      return NextResponse.next()
    }

    // If user is on wrong dashboard, redirect to correct one
    if (isAdminRoute && role !== 'admin') {
      const correctUrl = new URL(`/dashboard/${role}`, request.url)
      return NextResponse.redirect(correctUrl)
    }

    if (isVendorRoute && role !== 'vendor') {
      const correctUrl = new URL(`/dashboard/${role}`, request.url)
      return NextResponse.redirect(correctUrl)
    }

    if (isCoupleRoute && role !== 'couple') {
      const correctUrl = new URL(`/dashboard/${role}`, request.url)
      return NextResponse.redirect(correctUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/signup'
  ],
}
