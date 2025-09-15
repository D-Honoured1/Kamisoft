// middleware.ts - FIXED VERSION
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    // Create a response object
    let response = NextResponse.next({
      request,
    })

    // Check if environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase environment variables are missing')
      return response
    }

    // Create a Supabase client configured for middleware
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
              response = NextResponse.next({
                request,
              })
              cookiesToSet.forEach(({ name, value, options }) => {
                response.cookies.set(name, value, options)
              })
            } catch (error) {
              console.error('Error setting cookies:', error)
            }
          },
        },
      }
    )

    // Refresh session if expired
    await supabase.auth.getSession()

    // Get the user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Error getting session:', sessionError)
      return response
    }

    // Get the current path
    const currentPath = request.nextUrl.pathname

    // Protect admin routes (except login/signup)
    if (
      currentPath.startsWith('/admin') &&
      !currentPath.startsWith('/admin/login') &&
      !currentPath.startsWith('/admin/signup') &&
      !session
    ) {
      console.log('Redirecting to login - no session')
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }

    // Redirect authenticated users away from auth pages
    if (
      session &&
      (currentPath.startsWith('/admin/login') || 
       currentPath.startsWith('/admin/signup'))
    ) {
      console.log('Redirecting to admin - user is authenticated')
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/admin/login',
    '/admin/signup',
    '/auth/callback'
  ],
}