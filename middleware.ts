// middleware.ts - Add this file to your project root
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for public API routes and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/contact') ||
    pathname.startsWith('/api/service-requests') && request.method === 'POST' ||
    pathname.startsWith('/api/webhooks') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next()
  }

  // Check admin authentication for admin routes and admin API routes
  if (
    pathname.startsWith('/admin') && !pathname.startsWith('/admin/login') ||
    pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/login')
  ) {
    const token = request.cookies.get('admin_token')?.value

    if (!token) {
      console.log('[Middleware] No token found for:', pathname)
      
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    try {
      const jwtSecret = process.env.JWT_SECRET || "fallback-secret"
      jwt.verify(token, jwtSecret)
      console.log('[Middleware] Token found, allowing access to:', pathname)
      return NextResponse.next()
    } catch (error) {
      console.log('[Middleware] Invalid token for:', pathname)
      
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
      
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}