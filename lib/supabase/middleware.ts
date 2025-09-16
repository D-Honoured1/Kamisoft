import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase/server"  // <-- use your wrapper

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = await createServerClient() // <-- use your wrapped function

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect admin routes - redirect to admin login if not authenticated
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

  // Redirect authenticated users away from auth pages
  if (
    user &&
    (request.nextUrl.pathname.startsWith("/admin/login") ||
      request.nextUrl.pathname.startsWith("/admin/signup"))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/admin"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/admin/:path*"],
}
