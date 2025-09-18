// app/api/admin/debug-db/route.ts
export const dynamic = "force-dynamic"; // Add this line to fix the static rendering issue

import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    console.log("=== DATABASE DEBUG START ===")
    
    // Environment variables check
    const envCheck = {
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      JWT_SECRET: !!process.env.JWT_SECRET,
      SUPABASE_JWT_SECRET: !!process.env.SUPABASE_JWT_SECRET,
    }
    
    console.log("1. Environment variables:", envCheck)
    
    // Create Supabase client
    const supabase = createServerClient()
    console.log("2. Supabase client created")
    
    // Try to get all admin users
    const { data: allUsers, error: allUsersError } = await supabase
      .from("admin_users")
      .select("id, email, name, role, is_active, created_at")
    
    console.log("3. All users query:", { 
      error: allUsersError?.message, 
      userCount: allUsers?.length,
      users: allUsers 
    })
    
    // Try to get specific user
    const targetEmail = "danielausten@kamisoftenterprises.online"
    const { data: specificUser, error: specificError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", targetEmail)
      .maybeSingle() // Use maybeSingle instead of single to avoid error when no rows
    
    console.log("4. Specific user query:", { 
      error: specificError?.message, 
      user: specificUser ? { 
        id: specificUser.id, 
        email: specificUser.email, 
        name: specificUser.name,
        is_active: specificUser.is_active 
      } : null 
    })
    
    console.log("=== DATABASE DEBUG END ===")
    
    return NextResponse.json({
      success: true,
      environment: envCheck,
      database: {
        allUsers,
        allUsersError: allUsersError?.message,
        userCount: allUsers?.length || 0,
        specificUser: specificUser ? {
          id: specificUser.id,
          email: specificUser.email,
          name: specificUser.name,
          is_active: specificUser.is_active,
          hasPassword: !!specificUser.password
        } : null,
        specificError: specificError?.message,
        needsSetup: !specificUser && allUsers?.length === 0
      }
    })
    
  } catch (error) {
    console.error("=== DATABASE DEBUG ERROR ===")
    console.error("Error:", error)
    console.error("Stack:", error.stack)
    console.error("=== DATABASE DEBUG ERROR END ===")
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    }, { status: 500 })
  }
}