// components/providers/admin-auth-provider.tsx
"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
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

const INACTIVITY_TIMEOUT = 15 * 60 * 1000 // 15 minutes in milliseconds

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)

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
    // Clear inactivity timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
      inactivityTimerRef.current = null
    }

    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
    } finally {
      setUser(null)
      router.push("/admin/login")
    }
  }

  const refreshAuth = async () => {
    await verifyAuth()
  }

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    // Only track inactivity if user is logged in and on admin pages
    if (!user || !pathname?.startsWith('/admin') || pathname === '/admin/login') {
      return
    }

    // Clear existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }

    // Set new timer
    inactivityTimerRef.current = setTimeout(() => {
      logout()
    }, INACTIVITY_TIMEOUT)
  }, [user, pathname, logout])

  // Track user activity
  useEffect(() => {
    if (!user || !pathname?.startsWith('/admin') || pathname === '/admin/login') {
      return
    }

    // Activity events to track
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']

    const handleActivity = () => {
      resetInactivityTimer()
    }

    // Reset timer on initial mount
    resetInactivityTimer()

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity)
    })

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
    }
  }, [user, pathname, resetInactivityTimer])

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
