// middleware.ts
import { NextResponse, type NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import jwt from "jsonwebtoken"

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })
  const url = request.nextUrl.clone()

  // Only protect /admin routes
  if (!url.pathname.startsWith("/admin")) {
    return res
  }

  // Allow login & auth pages
  if (url.pathname.startsWith("/admin/login") || url.pathname.startsWith("/admin/auth")) {
    // If already logged in, redirect to /admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const jwtToken = request.cookies.get("admin_token")?.value
    const jwtValid = checkJWT(jwtToken)

    if ((user || jwtValid) && url.pathname.startsWith("/admin/login")) {
      url.pathname = "/admin"
      return NextResponse.redirect(url)
    }

    return res
  }

  // Protect all other /admin routes
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const jwtToken = request.cookies.get("admin_token")?.value
  const jwtValid = checkJWT(jwtToken)

  if (!user && !jwtValid) {
    url.pathname = "/admin/login"
    return NextResponse.redirect(url)
  }

  return res
}

// Helper function
function checkJWT(token?: string) {
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
