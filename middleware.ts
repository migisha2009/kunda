// Middleware disabled - auth handled client-side
// Last updated: April 2026
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: []
}
