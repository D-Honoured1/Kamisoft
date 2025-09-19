// components/navigation.tsx - IMPROVED VERSION
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Shield, Menu, X, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Services", href: "/services" },
  { name: "Products", href: "/products" },
  { name: "Portfolio", href: "/portfolio" },
  { name: "Leadership", href: "/leadership" },
  { name: "Contact", href: "/contact" },
]

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lastActivity, setLastActivity] = useState(Date.now())
  const pathname = usePathname()
  const router = useRouter()

  const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes

  useEffect(() => {
    const checkAuth = () => {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('admin_token='))
        ?.split('=')[1]
      
      setIsAuthenticated(!!token)
      setLoading(false)
    }
    
    checkAuth()
    const interval = setInterval(checkAuth, 2000)
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'admin_logout') {
        setIsAuthenticated(false)
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // Activity tracking for auto-logout
  useEffect(() => {
    if (!isAuthenticated) return

    const updateActivity = () => {
      setLastActivity(Date.now())
      localStorage.setItem('lastActivity', Date.now().toString())
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true)
    })

    const inactivityCheck = setInterval(() => {
      const storedActivity = localStorage.getItem('lastActivity')
      const lastActivityTime = storedActivity ? parseInt(storedActivity) : lastActivity
      
      if (Date.now() - lastActivityTime > INACTIVITY_TIMEOUT) {
        handleSignOut(true)
      }
    }, 60000)

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true)
      })
      clearInterval(inactivityCheck)
    }
  }, [isAuthenticated, lastActivity])

  const handleSignOut = async (isAutoLogout = false) => {
    try {
      setLoading(true)
      
      // Multiple approaches to ensure logout works
      
      // Method 1: Call logout API
      try {
        const response = await fetch("/admin/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })
        
        if (!response.ok) {
          throw new Error('Logout API failed')
        }
      } catch (apiError) {
        console.warn("Logout API failed, proceeding with manual cleanup:", apiError)
      }
      
      // Method 2: Manual cookie cleanup (fallback)
      // Clear cookie with various configurations
      const cookieConfigs = [
        "admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;",
        `admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`,
        `admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`,
        "admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=strict;",
      ]
      
      cookieConfigs.forEach(config => {
        document.cookie = config
      })
      
      // Method 3: Clear localStorage
      localStorage.removeItem('lastActivity')
      
      // Method 4: Trigger storage event for other tabs
      localStorage.setItem('admin_logout', Date.now().toString())
      setTimeout(() => localStorage.removeItem('admin_logout'), 100)
      
      // Update state
      setIsAuthenticated(false)
      
      if (isAutoLogout) {
        alert("You have been automatically logged out due to inactivity.")
      }
      
      // Force redirect
      window.location.href = "/admin/login"
      
    } catch (error) {
      console.error("Logout error:", error)
      
      // Emergency fallback - force page reload to login
      window.location.href = "/admin/login"
    } finally {
      setLoading(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">Kamisoft</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === item.href ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          <ThemeToggle />
          {!loading && !isAuthenticated && (
            <Button variant="outline" size="sm" asChild className="hidden md:inline-flex bg-transparent">
              <Link href="/admin/login">Admin</Link>
            </Button>
          )}
          {!loading && isAuthenticated && (
            <>
              <Button variant="outline" size="sm" asChild className="hidden md:inline-flex bg-transparent">
                <Link href="/admin">Dashboard</Link>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleSignOut()}
                disabled={loading}
                className="hidden md:inline-flex text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 bg-transparent border-red-200 dark:border-red-800"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {loading ? "..." : "Sign Out"}
              </Button>
            </>
          )}
          <Button asChild className="hidden md:inline-flex">
            <Link href="/request-service">Hire Us</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur">
          <div className="container py-4">
            <nav className="space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "block px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent",
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <Button asChild className="w-full mt-4">
                <Link href="/request-service" onClick={() => setIsMobileMenuOpen(false)}>
                  Hire Us
                </Link>
              </Button>
              {!loading && !isAuthenticated && (
                <Button variant="outline" asChild className="w-full mt-2 bg-transparent">
                  <Link href="/admin/login" onClick={() => setIsMobileMenuOpen(false)}>
                    Admin Login
                  </Link>
                </Button>
              )}
              {!loading && isAuthenticated && (
                <>
                  <Button variant="outline" asChild className="w-full mt-2 bg-transparent">
                    <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                      Dashboard
                    </Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      handleSignOut()
                    }}
                    disabled={loading}
                    className="w-full mt-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 bg-transparent border-red-200 dark:border-red-800"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {loading ? "Signing Out..." : "Sign Out"}
                  </Button>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}