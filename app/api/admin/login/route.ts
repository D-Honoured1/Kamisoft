// app/api/admin/login/route.ts
/*import { NextResponse } from "next/server"
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
} */

// app/api/admin/login/route.ts
import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { serialize } from "cookie"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    console.log("=== LOGIN API DEBUG START ===")
    
    const body = await req.json()
    const { email, password } = body
    
    console.log("1. Received request body:", { email, password: password ? "***" : "missing" })
    
    if (!email || !password) {
      console.log("2. Missing email or password")
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    console.log("3. Environment check:")
    console.log("   SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Set" : "✗ Missing")
    console.log("   SUPABASE_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ Set" : "✗ Missing")
    console.log("   JWT_SECRET:", process.env.JWT_SECRET ? "✓ Set" : "✗ Missing")
    
    // Connect to Supabase
    let supabase
    try {
      supabase = createServerClient()
      console.log("4. Supabase client created successfully")
    } catch (error) {
      console.error("4. Error creating Supabase client:", error)
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }
    
    // Test basic database connection
    try {
      const { data: testData, error: testError } = await supabase
        .from("admin_users")
        .select("count")
        .limit(1)
      
      console.log("5. Database connection test:", { testError: testError?.message || "none", hasData: !!testData })
    } catch (error) {
      console.error("5. Database connection test failed:", error)
    }
    
    // Query the admin_users table
    console.log("6. Querying for user:", email.toLowerCase().trim())
    const { data: adminUser, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .eq("is_active", true)
      .single()

    console.log("7. Database query result:")
    console.log("   Error:", error?.message || "none")
    console.log("   User found:", !!adminUser)
    console.log("   User details:", adminUser ? { id: adminUser.id, email: adminUser.email, name: adminUser.name } : "none")

    if (error) {
      console.error("8. Database error details:", error)
      
      // If it's a "no rows" error, that means the user doesn't exist
      if (error.code === 'PGRST116') {
        console.log("8a. User not found in database")
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      }
      
      return NextResponse.json({ 
        error: "Database query failed", 
        details: process.env.NODE_ENV === "development" ? error.message : undefined 
      }, { status: 500 })
    }

    if (!adminUser) {
      console.log("9. No admin user found for email:", email)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Password verification
    console.log("10. Verifying password...")
    const isValidPassword = password === adminUser.password
    console.log("11. Password valid:", isValidPassword)

    if (!isValidPassword) {
      console.log("12. Invalid password for user:", email)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log("13. Authentication successful for:", email)

    // Update last login
    try {
      const { error: updateError } = await supabase
        .from("admin_users")
        .update({ last_login: new Date().toISOString() })
        .eq("id", adminUser.id)

      if (updateError) {
        console.error("14. Error updating last login:", updateError)
      } else {
        console.log("14. Last login updated successfully")
      }
    } catch (error) {
      console.error("14. Exception updating last login:", error)
    }

    // Create JWT token
    const jwtSecret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || "fallback-secret"
    console.log("15. Creating JWT with secret length:", jwtSecret.length)
    
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

    console.log("16. JWT token created, length:", token.length)

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

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    }

    console.log("17. Setting cookie with options:", cookieOptions)

    response.headers.set(
      "Set-Cookie",
      serialize("admin_token", token, cookieOptions)
    )

    console.log("18. Login successful, returning response")
    console.log("=== LOGIN API DEBUG END ===")

    return response
  } catch (error) {
    console.error("=== LOGIN API ERROR ===")
    console.error("Error:", error)
    console.error("Stack:", error.stack)
    console.error("=== LOGIN API ERROR END ===")
    
    return NextResponse.json({ 
      error: "Internal server error", 
      details: process.env.NODE_ENV === "development" ? error.message : undefined 
    }, { status: 500 })
  }
}