"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Shield, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { createBrowserClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

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
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const supabase = createBrowserClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

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
          {!loading && !user && (
            <Button variant="outline" size="sm" asChild className="hidden md:inline-flex bg-transparent">
              <Link href="/admin/login">Admin</Link>
            </Button>
          )}
          {!loading && user && (
            <Button variant="outline" size="sm" asChild className="hidden md:inline-flex bg-transparent">
              <Link href="/admin">Dashboard</Link>
            </Button>
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
              {!loading && !user && (
                <Button variant="outline" asChild className="w-full mt-2 bg-transparent">
                  <Link href="/admin/login" onClick={() => setIsMobileMenuOpen(false)}>
                    Admin Login
                  </Link>
                </Button>
              )}
              {!loading && user && (
                <Button variant="outline" asChild className="w-full mt-2 bg-transparent">
                  <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                    Dashboard
                  </Link>
                </Button>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
