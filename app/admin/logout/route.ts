// app/admin/logout/route.ts
import { NextResponse } from "next/server"
import { serialize } from "cookie"

export async function POST() {
  const response = NextResponse.json({ success: true })

  response.headers.set(
    "Set-Cookie",
    serialize("admin_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      expires: new Date(0),
    })
  )

  return response
}