/ components/navigation.tsx - Updated with dynamic admin/signout button
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
  const [adminUser, setAdminUser] = useState<{ name: string; email: string } | null>(null)
  const pathname = usePathname()

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('admin_token='))
          ?.split('=')[1]
        
        if (token) {
          // Verify token with backend
          const response = await fetch('/api/admin/verify', {
            credentials: 'include'
          })
          
          if (response.ok) {
            const data = await response.json()
            setIsAuthenticated(true)
            setAdminUser(data.user)
          } else {
            setIsAuthenticated(false)
            setAdminUser(null)
          }
        } else {
          setIsAuthenticated(false)
          setAdminUser(null)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setIsAuthenticated(false)
        setAdminUser(null)
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
    
    // Check every 30 seconds
    const interval = setInterval(checkAuth, 30000)
    
    // Listen for storage events (logout from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'admin_logout') {
        setIsAuthenticated(false)
        setAdminUser(null)
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // Handle admin logout
  const handleSignOut = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setIsAuthenticated(false)
      setAdminUser(null)
      
      // Clear localStorage and trigger event for other tabs
      localStorage.setItem('admin_logout', Date.now().toString())
      setTimeout(() => localStorage.removeItem('admin_logout'), 100)
      
      // Redirect to home page
      window.location.href = '/'
    }
  }

  // Don't show navigation on admin pages when authenticated
  if (isAuthenticated && pathname.startsWith('/admin') && pathname !== '/admin/login') {
    return null
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
          
          {!loading && (
            <>
              {isAuthenticated ? (
                <div className="hidden md:flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {adminUser?.name || 'Admin'}
                  </span>
                  <Button variant="outline" size="sm" onClick={handleSignOut} className="bg-transparent">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                  <Button asChild>
                    <Link href="/admin">Dashboard</Link>
                  </Button>
                </div>
              ) : (
                <>
                  <Button variant="outline" size="sm" asChild className="hidden md:inline-flex bg-transparent">
                    <Link href="/admin/login">Admin</Link>
                  </Button>
                  <Button asChild className="hidden md:inline-flex">
                    <Link href="/request-service">Hire Us</Link>
                  </Button>
                </>
              )}
            </>
          )}

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
              
              <div className="pt-4 space-y-2">
                <Button asChild className="w-full">
                  <Link href="/request-service" onClick={() => setIsMobileMenuOpen(false)}>
                    Hire Us
                  </Link>
                </Button>
                
                {!loading && (
                  <>
                    {isAuthenticated ? (
                      <>
                        <Button asChild variant="outline" className="w-full bg-transparent">
                          <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                            Dashboard
                          </Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            handleSignOut()
                            setIsMobileMenuOpen(false)
                          }}
                          className="w-full bg-transparent"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign Out ({adminUser?.name || 'Admin'})
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" asChild className="w-full bg-transparent">
                        <Link href="/admin/login" onClick={() => setIsMobileMenuOpen(false)}>
                          Admin Login
                        </Link>
                      </Button>
                    )}
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}