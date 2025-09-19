// app/admin/logout/route.ts
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const cookieStore = cookies()
    
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      path: "/",
      expires: new Date(0),
    }

    const response = NextResponse.json({ 
      success: true, 
      message: "Logged out successfully" 
    })

    // Clear the cookie
    response.cookies.set("admin_token", "", cookieOptions)
    response.cookies.delete("admin_token")

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