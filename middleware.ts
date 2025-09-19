

// middleware.ts
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()

  // Only handle /admin routes
  if (!url.pathname.startsWith("/admin")) {
    return NextResponse.next()
  }

  // Allow access to login page and logout endpoint
  if (
    url.pathname === "/admin/login" || 
    url.pathname.startsWith("/admin/logout")
  ) {
    return NextResponse.next()
  }

  // Check for admin token cookie
  const adminToken = request.cookies.get("admin_token")?.value

  // If no token, redirect to login
  if (!adminToken) {
    console.log(`[Middleware] No admin token, redirecting to login from: ${url.pathname}`)
    const loginUrl = new URL("/admin/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Basic token validation (just check if it exists and looks like a JWT)
  // The actual validation will happen on the server side in the admin pages
  const tokenParts = adminToken.split('.')
  if (tokenParts.length !== 3) {
    console.log(`[Middleware] Invalid token format, redirecting to login`)
    const loginUrl = new URL("/admin/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  console.log(`[Middleware] Token found, allowing access to: ${url.pathname}`)
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all /admin routes except static files and API routes
    "/admin((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}