// app/api/admin/login/route.ts
import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import cookie from "cookie"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    // Replace this with your real admin validation
    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign({ role: "admin", email }, process.env.JWT_SECRET!, {
        expiresIn: "24h",
      })

      const response = NextResponse.json({ success: true, message: "Login successful" })

      response.headers.set(
        "Set-Cookie",
        cookie.serialize("admin_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
          maxAge: 60 * 60 * 24, // 24 hours
        })
      )

      return response
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}