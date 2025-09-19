// components/admin-navigation/admin-mobile-menu.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, LogOut } from "lucide-react"
import { usePathname } from "next/navigation"
import { useAdminAuth } from "@/hooks/use-admin-auth"

const adminNav = [
  { name: "Requests", href: "/admin/requests" },
  { name: "Clients", href: "/admin/clients" },
  { name: "Payments", href: "/admin/payments" },
  { name: "Portfolio", href: "/admin/portfolio" },
]

export function AdminMobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAdminAuth()

  const isMainDashboard = pathname === "/admin"
  const closeMenu = () => setIsOpen(false)

  if (!isMainDashboard) return null

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
        <div className="md:hidden py-4 border-t">
          <div className="space-y-1 mb-4">
            {adminNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block px-3 py-2 text-sm hover:bg-accent rounded-md"
                onClick={closeMenu}
              >
                {item.name}
              </Link>
            ))}
          </div>
          
          <div className="pt-4 border-t">
            <Button variant="outline" onClick={() => { logout(); closeMenu(); }} className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out ({user?.name})
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
