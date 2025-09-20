export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("admin_token")?.value

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const jwtSecret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET!
    
    try {
      const decoded = jwt.verify(token, jwtSecret) as any
      
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
      console.error("JWT verification failed:", jwtError)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
  } catch (error) {
    console.error("Admin verification error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}