// app/api/admin/verify/route.ts
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"

export async function GET() {
  console.log("🔍 VERIFY API CALLED")
  
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("admin_token")?.value

    console.log("🍪 Token found:", !!token)

    if (!token) {
      console.log("❌ No token provided")
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const jwtSecret = process.env.JWT_SECRET || "fallback-secret-key"
    console.log("🔑 JWT secret available:", !!jwtSecret)
    
    try {
      const decoded = jwt.verify(token, jwtSecret) as any
      console.log("✅ Token verified for user:", decoded.email)
      
      return NextResponse.json({
        success: true,
        user: {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role || 'admin'
        }
      })
    } catch (jwtError) {
      console.error("❌ JWT verification failed:", jwtError.message)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
  } catch (error) {
    console.error("💥 Verify error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error.message 
    }, { status: 500 })
  }
}