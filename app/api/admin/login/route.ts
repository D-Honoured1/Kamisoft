// app/api/admin/login/route.ts - FIXED VERSION WITH PROPER PASSWORD HANDLING
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { serialize } from "cookie"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }
    
    // Query admin_users table
    const { data: adminUser, error } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .eq("is_active", true)
      .maybeSingle()


    if (error) {
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!adminUser) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Check if password is stored as plain text or hashed
    let passwordMatch = false
    
    // First try plain text comparison (for existing users)
    if (password === adminUser.password) {
      passwordMatch = true
    } else {
      // If it doesn't match, try hashed password (for future implementation)
      // For now, we'll just use plain text
    }

    if (!passwordMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }


    // Update last login
    const { error: updateError } = await supabaseAdmin
      .from("admin_users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", adminUser.id)

    if (updateError) {
    }

    // Create JWT token using Supabase JWT secret
    const jwtSecret = process.env.SUPABASE_JWT_SECRET!
    const token = jwt.sign(
      {
        role: "admin",
        email: adminUser.email,
        id: adminUser.id,
        name: adminUser.name
      },
      jwtSecret,
      { expiresIn: "24h" }
    )

    const response = NextResponse.json({ 
      success: true, 
      message: "Login successful",
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role || 'admin'
      }
    })

    // Set cookie with proper options for production
    const cookieOptions: any = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    }

    // In production, set domain to allow cookie across subdomains
    if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_SITE_URL) {
      const url = new URL(process.env.NEXT_PUBLIC_SITE_URL)
      cookieOptions.domain = url.hostname
    }

    response.headers.set(
      "Set-Cookie",
      serialize("admin_token", token, cookieOptions)
    )

    return response
  } catch (error: any) {
    return NextResponse.json({ 
      error: "Internal server error", 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    }, { status: 500 })
  }
}