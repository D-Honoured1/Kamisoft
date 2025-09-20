"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft } from "lucide-react"
import { usePathname } from "next/navigation"

export function DashboardHomeButton() {
  const pathname = usePathname()
  
  // Don't show on main dashboard
  if (pathname === '/admin') {
    return null
  }
  
  // Only show on admin sub-pages
  if (!pathname.startsWith('/admin/')) {
    return null
  }

  return (
    <div className="mb-6">
      <Button variant="outline" size="sm" asChild>
        <Link href="/admin" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          <Home className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>
    </div>
  )
}