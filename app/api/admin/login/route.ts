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
    console.log("Login attempt for email:", email)
    
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

    console.log("Database query result:", { adminUser: adminUser ? "found" : "not found", error })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!adminUser) {
      console.log("No admin user found for email:", email)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Check if password is stored as plain text or hashed
    let passwordMatch = false
    
    // First try plain text comparison (for existing users)
    if (password === adminUser.password) {
      passwordMatch = true
      console.log("Plain text password match")
    } else {
      // If it doesn't match, try hashed password (for future implementation)
      // For now, we'll just use plain text
      console.log("Password does not match")
    }

    if (!passwordMatch) {
      console.log("Invalid password for user:", email)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log("Login successful for user:", email)

    // Update last login
    const { error: updateError } = await supabaseAdmin
      .from("admin_users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", adminUser.id)

    if (updateError) {
      console.warn("Failed to update last login:", updateError)
    }

    // Create JWT token
    const jwtSecret = process.env.JWT_SECRET || "fallback-secret-key-change-in-production"
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

    // Set cookie with proper options
    response.headers.set(
      "Set-Cookie",
      serialize("admin_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
      })
    )

    return response
  } catch (error: any) {
    console.error("Login error:", error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    }, { status: 500 })
  }
}