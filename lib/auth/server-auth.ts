// lib/auth/server-auth.ts
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { redirect } from "next/navigation"

export interface AdminUser {
  id: string
  email: string
  name: string
  role: string
}

export async function getAdminUser(): Promise<AdminUser | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("admin_token")?.value

    if (!token) {
      return null
    }

    const jwtSecret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET
    if (!jwtSecret) {
      console.error("[Auth] No JWT secret available")
      return null
    }

    const decoded = jwt.verify(token, jwtSecret) as any
    
    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    }
  } catch (error) {
    console.error("[Auth] Token verification failed:", error.message)
    return null
  }
}

export async function requireAuth(): Promise<AdminUser> {
  const user = await getAdminUser()
  
  if (!user) {
    redirect("/admin/login")
  }
  
  return user
}