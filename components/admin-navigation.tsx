// components/admin-navigation.tsx - Updated to show user info and signout
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Users, FileText, CreditCard, Briefcase, Settings, ArrowLeft, Menu, X, LogOut, User } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Service Requests", href: "/admin/requests", icon: FileText },
  { name: "Clients", href: "/admin/clients", icon: Users },
  { name: "Payments", href: "/admin/payments", icon: CreditCard },
  { name: "Portfolio", href: "/admin/portfolio", icon: Briefcase },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

export function AdminNavigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [adminUser, setAdminUser] = useState<{ name: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastActivity, setLastActivity] = useState(Date.now())
  const pathname = usePathname()
  const router = useRouter()

  const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/verify', {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          setAdminUser(data.user)
        } else {
          setAdminUser(null)
          router.push('/admin/login')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setAdminUser(null)
        router.push('/admin/login')
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
    const interval = setInterval(checkAuth, 2000)
    
    return () => clearInterval(interval)
  }, [router])

  // Activity tracking for auto-logout
  useEffect(() => {
    if (!adminUser) return

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
  }, [adminUser, lastActivity])

  const handleSignOut = async (isAutoLogout = false) => {
    try {
      setLoading(true)
      
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      })
      
      setAdminUser(null)
      localStorage.removeItem('lastActivity')
      
      if (isAutoLogout) {
        alert("You have been automatically logged out due to inactivity.")
      }
      
      router.push("/admin/login")
    } catch (error) {
      console.error("Logout error:", error)
      window.location.href = "/admin/login"
    } finally {
      setLoading(false)
    }
  }

  // Don't render anything while checking auth
  if (loading) {
    return (
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-muted rounded-lg animate-pulse"></div>
              <div className="ml-3 w-32 h-6 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  // Don't show navigation on login page
  if (pathname === "/admin/login") {
    return null
  }

  // Check if we're on a detail page that needs a back button
  const isDetailPage = pathname.match(/\/admin\/(clients|requests|payments|portfolio)\/[^\/]+$/) ||
                      pathname === "/admin/portfolio/new"

  const isSubPage = pathname === "/admin/requests" || 
                   pathname === "/admin/clients" || 
                   pathname === "/admin/payments" || 
                   pathname === "/admin/portfolio" ||
                   pathname === "/admin/settings"

  const showBackButton = isDetailPage || (isSubPage && pathname !== "/admin")

  return (
    <nav className="bg-card border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center">
            {showBackButton ? (
              <Button variant="ghost" size="sm" asChild className="mr-4">
                <Link href="/admin">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            ) : (
              <Link href="/admin" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">K</span>
                </div>
                <span className="font-bold text-xl text-foreground">Admin</span>
              </Link>
            )}
          </div>

          {/* Center - Desktop Navigation */}
          {adminUser && pathname === "/admin" && (
            <div className="hidden md:flex items-center space-x-1">
              {navigation.slice(1).map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-accent"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {adminUser && (
              <>
                {/* User info and Sign Out Button */}
                <div className="hidden md:flex items-center space-x-3">
                  <div className="flex items-center space-x-2 px-3 py-1 bg-muted/50 rounded-md">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{adminUser.name}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleSignOut()}
                    disabled={loading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 bg-transparent border-red-200 dark:border-red-800"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {loading ? "..." : "Sign Out"}
                  </Button>
                </div>
                
                {/* Mobile menu button */}
                {pathname === "/admin" && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden"
                  >
                    {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && adminUser && pathname === "/admin" && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="space-y-1 mb-4">
              {navigation.slice(1).map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-accent"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
            
            {/* Mobile user info and logout */}
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between px-3 py-2 mb-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{adminUser.name}</span>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => handleSignOut()}
                disabled={loading}
                className="w-full text-red-600 hover:text-red-700 bg-transparent border-red-200"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}