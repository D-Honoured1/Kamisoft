// components/navigation/mobile-menu.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, X, LogOut, User, Home, Info, Briefcase, Users, Mail, Folder, UserCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAdminAuth } from "@/hooks/use-admin-auth"

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "About", href: "/about", icon: Info },
  { name: "Services", href: "/services", icon: Briefcase },
  { name: "Products", href: "/products", icon: Folder },
  { name: "Portfolio", href: "/portfolio", icon: Users },
  { name: "Leadership", href: "/leadership", icon: UserCheck },
  { name: "Contact", href: "/contact", icon: Mail },
]

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { user, isAuthenticated, loading, logout } = useAdminAuth()

  const closeMenu = () => setIsOpen(false)
  
  // Hide mobile menu completely on admin pages - they have their own navigation
  if (pathname.startsWith('/admin')) {
    return null
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm" 
            onClick={closeMenu}
          />
          
          {/* Menu Panel */}
          <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-background shadow-xl border-l">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">K</span>
                  </div>
                  <span className="font-semibold text-lg">Menu</span>
                </div>
                <Button variant="ghost" size="sm" onClick={closeMenu}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Content based on authentication status */}
              <div className="flex-1 overflow-y-auto p-4">
                {!loading && isAuthenticated ? (
                  /* Admin is logged in - show only user info and sign out */
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <User className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg">Welcome back!</h3>
                      <p className="text-muted-foreground">{user?.name}</p>
                    </div>
                  </div>
                ) : (
                  /* Admin is not logged in - show full navigation */
                  <nav className="space-y-2">
                    {navigation.map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                            pathname === item.href
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                          )}
                          onClick={closeMenu}
                        >
                          <Icon className="h-5 w-5" />
                          {item.name}
                        </Link>
                      )
                    })}
                  </nav>
                )}
              </div>

              {/* Bottom Action Buttons */}
              <div className="p-4 border-t bg-muted/30 space-y-3">
                {!loading && isAuthenticated ? (
                  /* Admin is logged in - show only sign out */
                  <Button 
                    variant="outline" 
                    onClick={() => { logout(); closeMenu(); }}
                    className="w-full"
                    size="lg"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                ) : (
                  /* Admin is not logged in - show hire us and login */
                  <>
                    <Button asChild className="w-full" size="lg">
                      <Link href="/request-service" onClick={closeMenu}>
                        <Briefcase className="mr-2 h-4 w-4" />
                        Hire Us
                      </Link>
                    </Button>
                    
                    <Button variant="outline" asChild className="w-full" size="lg">
                      <Link href="/admin/login" onClick={closeMenu}>
                        <User className="mr-2 h-4 w-4" />
                        Admin Login
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}