// app/api/admin/login/route.ts
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { serialize } from "cookie"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }
    
    const supabase = createServerClient()
    
    // Query the admin_users table
    const { data: adminUser, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .eq("is_active", true)
      .maybeSingle()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
    }

    if (!adminUser) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Verify password (in production, use bcrypt.compare for hashed passwords)
    const isValidPassword = password === adminUser.password

    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Update last login
    await supabase
      .from("admin_users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", adminUser.id)

    // Create JWT token
    const jwtSecret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET!
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
        role: adminUser.role
      }
    })

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
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}