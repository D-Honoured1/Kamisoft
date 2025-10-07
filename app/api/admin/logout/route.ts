// app/api/admin/logout/route.ts - FIXED
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const cookieStore = cookies()
    
    const response = NextResponse.json({ 
      success: true, 
      message: "Logged out successfully" 
    })

    // Clear the cookie with proper options
    response.cookies.set({
      name: "admin_token",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      expires: new Date(0),
    })

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    )
  }
}

// Also handle GET requests for direct navigation
export async function GET() {
  return POST()
}