// components/navigation/index.tsx - OPTIMIZED VERSION
"use client"

import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { NavigationLogo } from "./navigation-logo"
import { NavigationMenu } from "./navigation-menu"
import { AuthButtons } from "./auth-buttons"
import { MobileMenu } from "./mobile-menu"

export function Navigation() {
  const pathname = usePathname()

  // Don't show navigation on admin pages (except login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <NavigationLogo />
        <NavigationMenu />
        
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <div className="hidden md:block">
            <AuthButtons />
          </div>
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}