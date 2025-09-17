/*import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const { supabase, res } = createSupabaseMiddlewareClient(request)

  // Only protect /admin routes (except login and auth callback)
  if (!url.pathname.startsWith("/admin")) {
    return res
  }

  // Allow access to login and auth callback pages
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
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  } catch {
    url.pathname = "/admin/login"
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: ["/admin((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
*/

import { NextResponse, type NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  const url = request.nextUrl.clone()

  // Only protect /admin routes
  if (!url.pathname.startsWith("/admin")) {
    return res
  }

  // Allow login and auth pages
  if (url.pathname.startsWith("/admin/login") || url.pathname.startsWith("/admin/auth")) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user && url.pathname.startsWith("/admin/login")) {
      url.pathname = "/admin"
      return NextResponse.redirect(url)
    }

    return res
  }

  // For protected admin routes
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    url.pathname = "/admin/login"
    return NextResponse.redirect(url)
  }

  return res
}

export const config = {
  matcher: ["/admin((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
