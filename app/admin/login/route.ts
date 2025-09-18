// app/api/admin/login/route.ts
import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import cookie from "cookie"

export async function POST(req: Request) {
  const { email, password } = await req.json()

  // Replace this with your real admin validation
  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    })

    const response = NextResponse.json({ success: true })

    response.headers.set(
      "Set-Cookie",
      cookie.serialize("admin_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60,
      })
    )

    return response
  }

  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
}
