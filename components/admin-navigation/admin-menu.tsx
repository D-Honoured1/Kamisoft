// components/admin-navigation/admin-menu.tsx
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"

const adminNav = [
  { name: "Requests", href: "/admin/requests" },
  { name: "Clients", href: "/admin/clients" },
  { name: "Payments", href: "/admin/payments" },
  { name: "Portfolio", href: "/admin/portfolio" },
]

export function AdminMenu() {
  const pathname = usePathname()
  const isMainDashboard = pathname === "/admin"

  if (!isMainDashboard) return null

  return (
    <div className="hidden md:flex items-center space-x-1">
      {adminNav.map((item) => (
        <Button key={item.name} variant="ghost" size="sm" asChild>
          <Link href={item.href}>{item.name}</Link>
        </Button>
      ))}
    </div>
  )
}
