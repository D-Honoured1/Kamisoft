// hooks/use-admin-auth.ts
"use client"

import { useState, useEffect } from "react"

export function useAdminAuth() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/verify', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch {
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
    loading,
    logout
  }
}
