// hooks/use-admin-auth.ts - COMPLETE FIXED VERSION
"use client"

import { useState, useEffect, useCallback } from "react"

export function useAdminAuth() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/verify', { 
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        // Handle both old and new response formats
        if (data.success || data.authenticated) {
          setUser(data.user)
        } else {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (mounted) {
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
    }
  }, [mounted, checkAuth])

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
    loading,
    logout
  }
}