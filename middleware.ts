// middleware.ts
/*import { NextResponse, type NextRequest } from "next/server"
import jwt from "jsonwebtoken"

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()

  // Only protect /admin routes
  if (!url.pathname.startsWith("/admin")) {
    return NextResponse.next()
  }

  // Allow login, logout, and auth pages
  if (
    url.pathname.startsWith("/admin/login") || 
    url.pathname.startsWith("/admin/logout") ||
    url.pathname.startsWith("/admin/auth")
  ) {
    // If already logged in and trying to access login, redirect to admin dashboard
    const jwtToken = request.cookies.get("admin_token")?.value
    const jwtValid = await checkJWT(jwtToken)

    if (jwtValid && url.pathname === "/admin/login") {
      url.pathname = "/admin"
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  }

  // Protect all other /admin routes
  const jwtToken = request.cookies.get("admin_token")?.value
  const jwtValid = await checkJWT(jwtToken)

  if (!jwtValid) {
    console.log(`[Middleware] Access denied to ${url.pathname}, redirecting to login`)
    url.pathname = "/admin/login"
    // Add a query parameter to help with debugging
    url.searchParams.set("redirect", request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  console.log(`[Middleware] Access granted to ${url.pathname}`)
  return NextResponse.next()
}

// Helper function to check JWT
async function checkJWT(token?: string): Promise<boolean> {
  if (!token) {
    console.log("[JWT Check] No token provided")
    return false
  }
  
  try {
    // Try JWT_SECRET first, then fallback to SUPABASE_JWT_SECRET
    const jwtSecret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET
    
    if (!jwtSecret) {
      console.log("[JWT Check] No JWT secret available")
      return false
    }
    
    const decoded = jwt.verify(token, jwtSecret)
    console.log("[JWT Check] Token valid for user:", (decoded as any)?.email)
    return true
  } catch (error) {
    console.log("[JWT Check] Token verification failed:", error.message)
    return false
  }
}

export const config = {
  matcher: [
    // Match all /admin routes except static files
    "/admin((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
} */

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