// app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/admin'

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        return NextResponse.redirect(`${requestUrl.origin}${next}`)
      } else {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(`${requestUrl.origin}/admin/auth/auth-code-error`)
      }
    } catch (error) {
      console.error('Unexpected error in auth callback:', error)
      return NextResponse.redirect(`${requestUrl.origin}/admin/auth/auth-code-error`)
    }
  }

  // Return the user to an error page if no code is provided
  return NextResponse.redirect(`${requestUrl.origin}/admin/auth/auth-code-error`)
}