import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const { supabase, res } = createSupabaseMiddlewareClient(request)

  // Only protect /admin routes
  if (!url.pathname.startsWith("/admin")) {
    return res
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Redirect unauthenticated users to login
    if (!user && !url.pathname.startsWith("/admin/login")) {
      url.pathname = "/admin/login"
      return NextResponse.redirect(url)
    }

    // Redirect logged-in users away from login page
    if (user && url.pathname.startsWith("/admin/login")) {
      url.pathname = "/admin"
      return NextResponse.redirect(url)
    }

    return res
  } catch {
    url.pathname = "/admin/login"
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: [
    "/admin((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
