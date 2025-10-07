// app/admin/logout/route.ts
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const cookieStore = cookies()

    // Clear the cookie
    cookieStore.delete("admin_token")

    return NextResponse.json({
      success: true,
      message: "Logged out successfully"
    })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    )
  }
}

// Also handle GET requests for direct navigation - redirect to home
export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    cookieStore.delete("admin_token")

    // Use the request URL to determine the correct base URL
    const url = new URL(request.url)
    const baseUrl = `${url.protocol}//${url.host}`

    return NextResponse.redirect(new URL("/", baseUrl))
  } catch (error) {
    console.error("Logout error:", error)
    // Fallback to request origin if available
    const url = new URL(request.url)
    const baseUrl = `${url.protocol}//${url.host}`
    return NextResponse.redirect(new URL("/", baseUrl))
  }
}