// components/admin-navigation.tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Users, FileText, CreditCard, Briefcase, Settings, ArrowLeft, Menu, X } from "lucide-react"
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
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  // Check authentication status on mount and periodically
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
    
    // Check every 2 seconds for auth changes
    const interval = setInterval(checkAuth, 2000)
    
    return () => clearInterval(interval)
  }, [])

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

  // Check for specific pages that need back buttons
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
              // Back button for detail pages and sub-pages
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="mr-4"
              >
                <Link href="/admin">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            ) : (
              // Logo for main dashboard
              <Link href="/admin" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">K</span>
                </div>
                <span className="font-bold text-xl text-foreground">Admin</span>
              </Link>
            )}
          </div>

          {/* Desktop Navigation - only show on dashboard */}
          {isAuthenticated && pathname === "/admin" && (
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

          {/* Mobile menu button - only show on dashboard */}
          <div className="md:hidden">
            {isAuthenticated && pathname === "/admin" && (
              <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation - only show on dashboard */}
        {isMobileMenuOpen && isAuthenticated && pathname === "/admin" && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="space-y-1">
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
          </div>
        )}
      </div>
    </nav>
  )
}