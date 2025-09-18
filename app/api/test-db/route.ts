// app/api/test-db/route.ts
// Create this file to test your database connection

import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    console.log("Testing database connection...")
    
    const supabase = createServerClient()
    
    // Test basic connection
    const { data, error } = await supabase
      .from("admin_users")
      .select("id, email, name")
    
    console.log("Database test result:", { data, error })
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      })
    }
    
    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      userCount: data?.length || 0,
      users: data?.map(user => ({ id: user.id, email: user.email, name: user.name }))
    })
    
  } catch (error) {
    console.error("Database test error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to connect to database",
      details: error instanceof Error ? error.message : "Unknown error"
    })
  }
}