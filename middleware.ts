import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const role = request.cookies.get('kunda-role')?.value

  // Only protect dashboard routes
  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next()
  }

  // No cookie = go to login
  if (!role) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Admin trying to access non-admin dashboard
  if (role === 'admin' && !pathname.startsWith('/dashboard/admin')) {
    return NextResponse.redirect(new URL('/dashboard/admin', request.url))
  }

  // Vendor trying to access non-vendor dashboard
  if (role === 'vendor' && !pathname.startsWith('/dashboard/vendor')) {
    return NextResponse.redirect(new URL('/dashboard/vendor', request.url))
  }

  // Couple trying to access non-couple dashboard
  if (role === 'couple' && !pathname.startsWith('/dashboard/couple')) {
    return NextResponse.redirect(new URL('/dashboard/couple', request.url))
  }

  // Role matches route - let through
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*']
}
