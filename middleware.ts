// middleware.ts - SIMPLE VERSION (no JWT validation)
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()

  // Only handle /admin routes
  if (!url.pathname.startsWith("/admin")) {
    return NextResponse.next()
  }

  // Allow access to login page, auth endpoints, and API routes
  if (
    url.pathname === "/admin/login" ||
    url.pathname.startsWith("/admin/logout") ||
    url.pathname.startsWith("/admin/auth") ||
    url.pathname.startsWith("/api/admin")
  ) {
    return NextResponse.next()
  }

  // Simple check: if no admin_token cookie, redirect to login
  const adminToken = request.cookies.get("admin_token")?.value

  if (!adminToken) {
    console.log(`[Middleware] No admin token, redirecting to login from: ${url.pathname}`)
    const loginUrl = new URL("/admin/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Token exists, let the API routes handle validation
  console.log(`[Middleware] Token found, allowing access to: ${url.pathname}`)
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all /admin routes except static files and API routes
    "/admin((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}