// hooks/use-admin-auth.ts - SSR-SAFE VERSION
"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

export function useAdminAuth() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  // Track if component is mounted (client-side)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Only check auth if we're on admin pages or if there's already a token
  const shouldCheckAuth = mounted && (
    pathname.startsWith('/admin') || 
    document.cookie.includes('admin_token=')
  )

  useEffect(() => {
    if (shouldCheckAuth) {
      checkAuth()
      const interval = setInterval(checkAuth, 30000) // Check every 30 seconds
      
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'admin_logout') {
          setUser(null)
        }
      }
      
      window.addEventListener('storage', handleStorageChange)
      
      return () => {
        clearInterval(interval)
        window.removeEventListener('storage', handleStorageChange)
      }
    } else if (mounted) {
      // Component is mounted but we don't need to check auth
      setLoading(false)
    }
  }, [shouldCheckAuth, mounted])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/verify', { 
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/admin/logout', { 
        method: 'POST', 
        credentials: 'include' 
      })
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setUser(null)
      localStorage.setItem('admin_logout', Date.now().toString())
      setTimeout(() => localStorage.removeItem('admin_logout'), 100)
      window.location.href = '/'
    }
  }

  // Return safe defaults during SSR
  if (!mounted) {
    return {
      user: null,
      isAuthenticated: false,
      loading: false,
      logout: () => {}
    }
  }

  return {
    user,
    isAuthenticated: !!user,
    loading: shouldCheckAuth ? loading : false,
    logout
  }
}