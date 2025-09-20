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
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {isOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur">
          <div className="container py-4">
            {!loading && isAuthenticated ? (
              /* Admin is logged in - show only sign out */
              <div className="space-y-3">
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">Signed in as</p>
                  <p className="font-medium">{user?.name}</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => { logout(); closeMenu(); }}
                  className="w-full"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            ) : (
              /* Admin is not logged in - show full navigation */
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
                    onClick={closeMenu}
                  >
                    {item.name}
                  </Link>
                ))}
                
                <div className="pt-4 space-y-2 border-t">
                  <Button asChild className="w-full">
                    <Link href="/request-service" onClick={closeMenu}>
                      Hire Us
                    </Link>
                  </Button>
                  
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/admin/login" onClick={closeMenu}>
                      Admin Login
                    </Link>
                  </Button>
                </div>
              </nav>
            )}
          </div>
        </div>
      )}
    </>
  )
}