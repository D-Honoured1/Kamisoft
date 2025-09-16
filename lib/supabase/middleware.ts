import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  try {
    // Use your wrapped Supabase client
    const supabase = await createServerClient()

    // Runtime-only check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Protect admin routes
    if (
      request.nextUrl.pathname.startsWith("/admin") &&
      !request.nextUrl.pathname.startsWith("/admin/login") &&
      !request.nextUrl.pathname.startsWith("/admin/signup") &&
      !request.nextUrl.pathname.startsWith("/admin/auth") &&
      !user
    ) {
      const url = request.nextUrl.clone()
      url.pathname = "/admin/login"
      return NextResponse.redirect(url)
    }

    // Redirect authenticated users away from login/signup
    if (
      user &&
      (request.nextUrl.pathname.startsWith("/admin/login") ||
        request.nextUrl.pathname.startsWith("/admin/signup"))
    ) {
      const url = request.nextUrl.clone()
      url.pathname = "/admin"
      return NextResponse.redirect(url)
    }
  } catch (err) {
    console.error("Middleware auth error:", err)
    // Don't crash the build or runtime
    return supabaseResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/admin/:path*"],
}
