import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin")

  if (isAdminRoute) {
    if (!user) {
      return NextResponse.redirect(new URL("/admin/login", req.url))
    }

    // 🔒 Only allow role = "admin"
    const role = user?.app_metadata?.role
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url)) // kick non-admins out
    }
  }

  return res
}

export const config = {
  matcher: ["/admin/:path*"],
}
