"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Home } from "lucide-react"
import { usePathname } from "next/navigation"

export function AdminLogo() {
  const pathname = usePathname()
  
  // Check if we're on a detail/sub page (more than 2 path segments after /admin)
  const pathSegments = pathname.split('/').filter(Boolean)
  const isDetailPage = pathSegments.length > 2 && pathSegments[0] === 'admin'
  const isMainDashboard = pathname === '/admin'

  if (isDetailPage) {
    return (
      <div className="flex items-center space-x-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <div className="h-6 w-px bg-border" />
        <Link href="/admin" className="flex items-center space-x-2">
          <Image
            src="/logo.svg"
            alt="Kamisoft Logo"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="font-bold text-lg">Admin</span>
        </Link>
      </div>
    )
  }

  return (
    <Link href="/admin" className="flex items-center space-x-2">
      <Image
        src="/logo.svg"
        alt="Kamisoft Logo"
        width={32}
        height={32}
        className="h-8 w-8"
      />
      <span className="font-bold text-xl">
        {isMainDashboard ? 'Kamisoft Admin' : 'Admin'}
      </span>
    </Link>
  )
}