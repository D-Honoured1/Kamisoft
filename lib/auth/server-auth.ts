// lib/auth/server-auth.ts
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

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

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET!
    const decoded = jwt.verify(token, jwtSecret) as any

    if (!decoded || decoded.role !== "admin") {
      return null
    }

    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    }
  } catch (error) {
    return null
  }
}

export async function requireAuth(): Promise<AdminUser> {
  const adminUser = await getAdminUser()
  
  if (!adminUser) {
    redirect("/admin/login")
  }
  
  return adminUser
}