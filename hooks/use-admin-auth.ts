// hooks/use-admin-auth.ts - OPTIMIZED VERSION
"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

export function useAdminAuth() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  // Only check auth if we're on admin pages or if there's already a token
  const shouldCheckAuth = pathname.startsWith('/admin') || document.cookie.includes('admin_token=')

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
    } else {
      // Not on admin pages and no token - skip auth check
      setLoading(false)
    }
  }, [shouldCheckAuth])

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

  return {
    user,
    isAuthenticated: !!user,
    loading: shouldCheckAuth ? loading : false, // Don't show loading if we're not checking
    logout
  }
}