// // app/api/admin/login/route.ts
// export const dynamic = "force-dynamic"

// import { NextResponse } from "next/server"
// import jwt from "jsonwebtoken"
// import { serialize } from "cookie"
// import { createServerClient } from "@/lib/supabase/server"

// export async function POST(req: Request) {
//   try {
//     const { email, password } = await req.json()
    
//     if (!email || !password) {
//       return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
//     }
    
//     const supabase = createServerClient()
    
//     // Query the admin_users table
//     const { data: adminUser, error } = await supabase
//       .from("admin_users")
//       .select("*")
//       .eq("email", email.toLowerCase().trim())
//       .eq("is_active", true)
//       .maybeSingle()

//     if (error) {
//       console.error("Database error:", error)
//       return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
//     }

//     if (!adminUser) {
//       return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
//     }

//     // Verify password (in production, use bcrypt.compare for hashed passwords)
//     const isValidPassword = password === adminUser.password

//     if (!isValidPassword) {
//       return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
//     }

//     // Update last login
//     await supabase
//       .from("admin_users")
//       .update({ last_login: new Date().toISOString() })
//       .eq("id", adminUser.id)

//     // Create JWT token
//     const jwtSecret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET!
//     const token = jwt.sign(
//       { 
//         role: "admin", 
//         email: adminUser.email,
//         id: adminUser.id,
//         name: adminUser.name
//       }, 
//       jwtSecret, 
//       { expiresIn: "24h" }
//     )

//     const response = NextResponse.json({ 
//       success: true, 
//       message: "Login successful",
//       user: {
//         id: adminUser.id,
//         email: adminUser.email,
//         name: adminUser.name,
//         role: adminUser.role
//       }
//     })

//     response.headers.set(
//       "Set-Cookie",
//       serialize("admin_token", token, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "strict",
//         path: "/",
//         maxAge: 60 * 60 * 24, // 24 hours
//       })
//     )

//     return response
//   } catch (error) {
//     console.error("Login error:", error)
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 })
//   }
// }

// app/api/admin/login/route.ts - WITH DEBUG LOGS
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { serialize } from "cookie"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  console.log("🚀 LOGIN API CALLED")
  
  try {
    const { email, password } = await req.json()
    
    console.log("📧 Login attempt for:", email)
    console.log("🔑 Password provided:", !!password)
    
    // Check environment variables
    console.log("🌍 Environment check:", {
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      JWT_SECRET: !!process.env.JWT_SECRET,
      URL_VALUE: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "..."
    })
    
    if (!email || !password) {
      console.log("❌ Missing email or password")
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log("❌ Missing Supabase environment variables")
      return NextResponse.json({ error: "Server configuration error - missing Supabase config" }, { status: 500 })
    }
    
    // Create Supabase client
    console.log("🔗 Creating Supabase client...")
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    console.log("🔍 Querying admin_users table...")
    
    // Query the admin_users table
    const { data: adminUser, error } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .eq("is_active", true)
      .maybeSingle()

    console.log("📊 Database query result:", { 
      foundUser: !!adminUser, 
      error: error?.message,
      errorCode: error?.code
    })

    if (error) {
      console.error("💥 Database error:", error)
      
      if (error.message.includes("relation") && error.message.includes("does not exist")) {
        return NextResponse.json({ 
          error: "Admin users table not found. Please run the database setup script." 
        }, { status: 500 })
      }
      
      return NextResponse.json({ error: "Database error occurred: " + error.message }, { status: 500 })
    }

    if (!adminUser) {
      console.log("❌ No admin user found for email:", email)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log("✅ Admin user found:", adminUser.email)

    // Verify password
    const isValidPassword = password === adminUser.password
    console.log("🔐 Password check:", isValidPassword)

    if (!isValidPassword) {
      console.log("❌ Invalid password for user:", email)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Check JWT secret
    const jwtSecret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET
    if (!jwtSecret) {
      console.error("❌ JWT_SECRET not configured")
      return NextResponse.json({ error: "Server configuration error - missing JWT secret" }, { status: 500 })
    }

    console.log("🎟️ Creating JWT token...")
    
    // Update last login
    await supabaseAdmin
      .from("admin_users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", adminUser.id)

    // Create JWT token
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

    console.log("🎉 Login successful for:", email)
    return response
    
  } catch (error) {
    console.error("💥 Login error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error.message
    }, { status: 500 })
  }
}