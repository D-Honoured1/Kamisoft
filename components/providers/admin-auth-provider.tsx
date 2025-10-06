// components/providers/admin-auth-provider.tsx
"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"

interface AdminUser {
  id: string
  email: string
  name: string
  role: string
}

interface AdminAuthContextType {
  user: AdminUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const verifyAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/verify", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        setUser(null)
        // Only redirect if we're on an admin page (not login)
        if (pathname?.startsWith("/admin") && pathname !== "/admin/login") {
          router.push("/admin/login")
        }
      }
    } catch (error) {
      console.error("Auth verification failed:", error)
      setUser(null)
      if (pathname?.startsWith("/admin") && pathname !== "/admin/login") {
        router.push("/admin/login")
      }
    } finally {
      setIsLoading(false)
    }
  }, [pathname, router])

  // Verify auth state ONLY when provider mounts (not on every route change)
  useEffect(() => {
    const currentPath = window.location.pathname

    // Skip verification on login page
    if (currentPath === "/admin/login") {
      setIsLoading(false)
      return
    }

    // Only verify on admin routes
    if (!currentPath?.startsWith("/admin")) {
      setIsLoading(false)
      return
    }

    // Only verify once on mount
    verifyAuth()
  }, [verifyAuth]) // Only depends on verifyAuth, not pathname

  const login = async (email: string, password: string) => {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Login failed")
    }

    const data = await response.json()
    setUser(data.user)
    router.push("/admin")
  }

  const logout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setUser(null)
      router.push("/")
    }
  }

  const refreshAuth = async () => {
    await verifyAuth()
  }

  return (
    <AdminAuthContext.Provider value={{ user, isLoading, login, logout, refreshAuth }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider")
  }
  return context
}
