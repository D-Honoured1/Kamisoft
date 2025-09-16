import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()

  // Only protect /admin routes
  if (!url.pathname.startsWith("/admin")) {
    return NextResponse.next()
  }

  const supabase = await createServerClient()

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

    return NextResponse.next()
  } catch (err) {
    // In case of any Supabase errors, force redirect to login
    url.pathname = "/admin/login"
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: [
    "/admin((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
