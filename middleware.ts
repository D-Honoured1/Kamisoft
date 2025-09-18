// middleware.ts
import { NextResponse, type NextRequest } from "next/server"
import jwt from "jsonwebtoken"

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()

  // Only protect /admin routes
  if (!url.pathname.startsWith("/admin")) {
    return NextResponse.next()
  }

  // Allow login & auth pages
  if (url.pathname.startsWith("/admin/login") || url.pathname.startsWith("/admin/auth")) {
    // If already logged in, redirect to /admin
    const jwtToken = request.cookies.get("admin_token")?.value
    const jwtValid = checkJWT(jwtToken)

    if (jwtValid && url.pathname.startsWith("/admin/login")) {
      url.pathname = "/admin"
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  }

  // Protect all other /admin routes
  const jwtToken = request.cookies.get("admin_token")?.value
  const jwtValid = checkJWT(jwtToken)

  if (!jwtValid) {
    url.pathname = "/admin/login"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

// Helper function to check JWT
function checkJWT(token?: string): boolean {
  if (!token) return false
  try {
    jwt.verify(token, process.env.JWT_SECRET!)
    return true
  } catch {
    return false
  }
}

export const config = {
  matcher: [
    "/admin((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}