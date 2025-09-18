// app/api/admin/login/route.ts
import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
<<<<<<< HEAD
import { serialize } from "cookie"
import { createServerClient } from "@/lib/supabase/server"
=======
import cookie from "cookie"
>>>>>>> parent of f155a2e (claude 2)

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
<<<<<<< HEAD
    
    console.log("Login attempt for email:", email)
    
    if (!email || !password) {
      console.log("Missing email or password")
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }
    
    // Connect to Supabase to verify admin credentials
    const supabase = createServerClient()
    
    console.log("Connecting to Supabase...")
    
    // First, let's check if the table exists and has data
    const { data: allAdmins, error: countError } = await supabase
      .from("admin_users")
      .select("email")
    
    console.log("All admin emails in database:", allAdmins)
    console.log("Count error:", countError)
    
    // Query the admin_users table
    const { data: adminUser, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .single()

    console.log("Database query result:", { adminUser, error })

    if (error) {
      console.log("Supabase error:", error)
      return NextResponse.json({ 
        error: "Database error", 
        details: error.message 
      }, { status: 500 })
    }

    if (!adminUser) {
      console.log("No admin user found for email:", email)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log("Admin user found:", { id: adminUser.id, email: adminUser.email })

    // Check if user is active (if column exists)
    if (adminUser.is_active === false) {
      console.log("Admin user is inactive")
      return NextResponse.json({ error: "Account is inactive" }, { status: 401 })
    }

    // Verify password
    console.log("Comparing passwords...")
    const isValidPassword = password === adminUser.password

    if (!isValidPassword) {
      console.log("Password mismatch")
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log("Password valid, creating JWT...")

    // Check if JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET not found in environment variables")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    // Update last login (optional, can skip if causing issues)
    try {
      await supabase
        .from("admin_users")
        .update({ last_login: new Date().toISOString() })
        .eq("id", adminUser.id)
    } catch (updateError) {
      console.log("Failed to update last_login:", updateError)
      // Don't fail the login if this update fails
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        role: "admin", 
        email: adminUser.email,
        id: adminUser.id,
        name: adminUser.name
      }, 
      process.env.JWT_SECRET!, 
      { expiresIn: "24h" }
    )

    console.log("JWT created successfully")

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

    response.headers.set(
      "Set-Cookie",
      serialize("admin_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
=======

    // Replace this with your real admin validation
    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign({ role: "admin", email }, process.env.JWT_SECRET!, {
        expiresIn: "24h",
>>>>>>> parent of f155a2e (claude 2)
      })

<<<<<<< HEAD
    console.log("Login successful for:", email)
    return response

=======
      const response = NextResponse.json({ success: true, message: "Login successful" })

      response.headers.set(
        "Set-Cookie",
        cookie.serialize("admin_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
          maxAge: 60 * 60 * 24, // 24 hours
        })
      )

      return response
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
>>>>>>> parent of f155a2e (claude 2)
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}