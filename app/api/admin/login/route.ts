// app/api/admin/login/route.ts
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

    console.log("Login attempt for:", email)
    
    // Connect to Supabase to verify admin credentials
    const supabase = createServerClient()
    
    // Query the admin_users table
    const { data: adminUser, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .eq("is_active", true)
      .single()

    console.log("Database query result:", { adminUser, error })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    if (!adminUser) {
      console.log("No admin user found for email:", email)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // For now, using plain text password comparison
    // In production, you should hash passwords and use bcrypt.compare()
    const isValidPassword = password === adminUser.password

    if (!isValidPassword) {
      console.log("Invalid password for user:", email)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log("Authentication successful for:", email)

    // Update last login
    const { error: updateError } = await supabase
      .from("admin_users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", adminUser.id)

    if (updateError) {
      console.error("Error updating last login:", updateError)
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        role: "admin", 
        email: adminUser.email,
        id: adminUser.id,
        name: adminUser.name
      }, 
      process.env.JWT_SECRET || "fallback-secret", 
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
    return NextResponse.json({ 
      error: "Internal server error", 
      details: process.env.NODE_ENV === "development" ? error.message : undefined 
    }, { status: 500 })
  }
}