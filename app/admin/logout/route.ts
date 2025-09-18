// app/app/admin/logout/route.ts
import { NextResponse } from "next/server"
import cookie from "cookie"

export async function POST() {
  const response = NextResponse.json({ success: true })

  response.headers.set(
    "Set-Cookie",
    cookie.serialize("admin_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      expires: new Date(0),
    })
  )

  return response
}
