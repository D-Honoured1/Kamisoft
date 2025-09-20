// components/navigation/mobile-menu.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, X, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAdminAuth } from "@/hooks/use-admin-auth"

const navigation = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Services", href: "/services" },
  { name: "Products", href: "/products" },
  { name: "Portfolio", href: "/portfolio" },
  { name: "Leadership", href: "/leadership" },
  { name: "Contact", href: "/contact" },
]

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { user, isAuthenticated, loading, logout } = useAdminAuth()

  const closeMenu = () => setIsOpen(false)
  
  // Hide mobile menu completely on admin pages
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
        aria-label="Toggle mobile menu"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {isOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 z-50 border-t bg-background shadow-lg">
          <div className="container py-6 max-h-[calc(100vh-4rem)] overflow-y-auto">
            {!loading && isAuthenticated ? (
              /* Admin is logged in - show only sign out button */
              <div className="space-y-4">
                <div className="text-center py-6 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Signed in as</p>
                  <p className="font-semibold text-lg">{user?.name}</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => { logout(); closeMenu(); }}
                  className="w-full h-12 text-base font-medium"
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  Sign Out
                </Button>
              </div>
            ) : (
              /* Admin is not logged in - show full navigation */
              <div className="space-y-6">
                <nav className="space-y-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "block px-4 py-3 rounded-lg text-base font-medium transition-colors",
                        pathname === item.href
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-foreground hover:text-primary hover:bg-muted",
                      )}
                      onClick={closeMenu}
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>
                
                <div className="pt-4 space-y-3 border-t">
                  <Button asChild className="w-full h-12 text-base font-medium">
                    <Link href="/request-service" onClick={closeMenu}>
                      Hire Us
                    </Link>
                  </Button>
                  
                  <Button variant="outline" asChild className="w-full h-12 text-base font-medium">
                    <Link href="/admin/login" onClick={closeMenu}>
                      Admin Login
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}