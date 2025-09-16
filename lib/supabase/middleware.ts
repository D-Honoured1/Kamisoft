// lib/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

/**
 * Create a Supabase server client tied to the middleware request/response.
 * Returns both the supabase client and a NextResponse to return from middleware.
 */
export function createSupabaseMiddlewareClient(request: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // mirror cookies into the response so browser and server stay in sync
              res.cookies.set(name, value, options)
            })
          } catch (err) {
            // ignore safely
            console.warn("createSupabaseMiddlewareClient setAll error", err)
          }
        },
      },
    }
  )

  return { supabase, res }
}
