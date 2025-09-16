import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const { supabase, res } = createSupabaseMiddlewareClient(request)

  // Only protect /admin routes (except login and auth callback)
  if (!url.pathname.startsWith("/admin")) {
    return res
  }

  // Allow access to login and auth callback pages only
  if (url.pathname.startsWith("/admin/login") || url.pathname.startsWith("/admin/auth")) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user && url.pathname.startsWith("/admin/login")) {
        url.pathname = "/admin"
        return NextResponse.redirect(url)
      }
    } catch {
      // Continue to login page if there's an error
    }
    return res
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    // Redirect unauthenticated users to login
    if (!user || error) {
      url.pathname = "/admin/login"
      const response = NextResponse.redirect(url)
      response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
      response.headers.set("Pragma", "no-cache")
      response.headers.set("Expires", "0")
      return response
    }

    const response = NextResponse.next()
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")
    response.headers.set("X-Frame-Options", "DENY")
    response.headers.set("X-Content-Type-Options", "nosniff")

    return response
  } catch {
    url.pathname = "/admin/login"
    const response = NextResponse.redirect(url)
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")
    return response
  }
}

export const config = {
  matcher: ["/admin((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
