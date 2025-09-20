// app/api/admin/verify/route.ts
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"

export async function GET() {
  console.log("🔍 VERIFY API CALLED")
  
  try {
    // For now, just return that we're not authenticated
    return NextResponse.json({ 
      error: "No token provided",
      message: "Verify API is working but no authentication yet"
    }, { status: 401 })
    
  } catch (error) {
    console.error("💥 Verify error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error.message 
    }, { status: 500 })
  }
}