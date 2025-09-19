// components/admin-navigation/index.tsx - Main Admin Navigation Component
"use client"

import { usePathname } from "next/navigation"
import { AdminLogo } from "./admin-logo"
import { AdminMenu } from "./admin-menu"
import { AdminUserInfo } from "./admin-user-info"
import { AdminMobileMenu } from "./admin-mobile-menu"

export function AdminNavigation() {
  const pathname = usePathname()

  if (pathname === "/admin/login") return null

  return (
    <nav className="bg-card border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <AdminLogo />
          <AdminMenu />
          <div className="flex items-center space-x-4">
            <AdminUserInfo />
            <AdminMobileMenu />
          </div>
        </div>
      </div>
    </nav>
  )
}
