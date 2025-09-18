// app/api/admin/setup/route.ts
import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    console.log("=== ADMIN SETUP START ===")
    
    const supabase = createServerClient()
    
    // First, let's create the admin_users table if it doesn't exist
    console.log("1. Creating admin_users table...")
    
    // Since we can't run DDL through the client, let's just try to insert
    // and handle the error if the table doesn't exist
    
    const adminData = {
      email: "danielausten@kamisoftenterprises.online",
      password: "Kami_Unrivalled", // In production, hash this!
      name: "Daniel Austen",
      role: "super_admin",
      is_active: true
    }
    
    console.log("2. Attempting to insert admin user...")
    
    // Try to insert with upsert to handle duplicates
    const { data: insertData, error: insertError } = await supabase
      .from("admin_users")
      .upsert(adminData, { 
        onConflict: 'email',
        ignoreDuplicates: false 
      })
      .select()
    
    if (insertError) {
      console.error("3. Insert error:", insertError)
      
      // If table doesn't exist, provide SQL to create it
      if (insertError.code === '42P01') {
        return NextResponse.json({
          success: false,
          error: "admin_users table doesn't exist",
          sqlToRun: `
-- Run this SQL in your Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert admin user:
INSERT INTO admin_users (email, password, name, role) 
VALUES (
    '${adminData.email}',
    '${adminData.password}',
    '${adminData.name}',
    '${adminData.role}'
) ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = NOW();
          `
        })
      }
      
      return NextResponse.json({
        success: false,
        error: insertError.message,
        code: insertError.code,
        details: insertError
      })
    }
    
    console.log("3. Admin user created/updated successfully")
    
    // Verify the user was created
    const { data: verifyData, error: verifyError } = await supabase
      .from("admin_users")
      .select("id, email, name, role, is_active")
      .eq("email", adminData.email)
      .single()
    
    console.log("4. Verification result:", { verifyError: verifyError?.message, verifyData })
    
    console.log("=== ADMIN SETUP END ===")
    
    return NextResponse.json({
      success: true,
      message: "Admin user setup complete",
      user: verifyData,
      inserted: insertData
    })
    
  } catch (error) {
    console.error("=== ADMIN SETUP ERROR ===")
    console.error("Error:", error)
    console.error("Stack:", error.stack)
    console.error("=== ADMIN SETUP ERROR END ===")
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    }, { status: 500 })
  }
}