// app/api/admin/debug-db/route.ts
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
    
    // Check if admin_users table exists
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_list')
      .select('*')
    
    console.log("3. Table check result:", { tablesError: tablesError?.message })
    
    // Try to get all admin users
    const { data: allUsers, error: allUsersError } = await supabase
      .from("admin_users")
      .select("id, email, name, role, is_active, created_at")
    
    console.log("4. All users query:", { 
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
      .single()
    
    console.log("5. Specific user query:", { 
      error: specificError?.message, 
      user: specificUser ? { 
        id: specificUser.id, 
        email: specificUser.email, 
        name: specificUser.name,
        is_active: specificUser.is_active 
      } : null 
    })
    
    // Test with different email formats
    const emailVariations = [
      targetEmail,
      targetEmail.toLowerCase(),
      targetEmail.trim(),
      targetEmail.toLowerCase().trim()
    ]
    
    const emailTests = []
    for (const emailVar of emailVariations) {
      const { data, error } = await supabase
        .from("admin_users")
        .select("id, email")
        .eq("email", emailVar)
        .single()
      
      emailTests.push({
        email: emailVar,
        found: !!data,
        error: error?.code
      })
    }
    
    console.log("6. Email variation tests:", emailTests)
    
    // Try to create the admin user if it doesn't exist
    let insertResult = null
    if (!specificUser) {
      console.log("7. Attempting to create admin user...")
      const { data: insertData, error: insertError } = await supabase
        .from("admin_users")
        .insert({
          email: targetEmail,
          password: "Kami_Unrivalled",
          name: "Daniel Austen",
          role: "super_admin",
          is_active: true
        })
        .select()
      
      insertResult = {
        success: !insertError,
        error: insertError?.message,
        data: insertData
      }
      
      console.log("7. Insert result:", insertResult)
    }
    
    console.log("=== DATABASE DEBUG END ===")
    
    return NextResponse.json({
      success: true,
      environment: envCheck,
      database: {
        allUsers,
        allUsersError: allUsersError?.message,
        specificUser: specificUser ? {
          id: specificUser.id,
          email: specificUser.email,
          name: specificUser.name,
          is_active: specificUser.is_active,
          hasPassword: !!specificUser.password
        } : null,
        specificError: specificError?.message,
        emailTests,
        insertResult
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