// components/navigation/auth-buttons.tsx - NO AUTH CHECK VERSION
"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function AuthButtons() {
  return (
    <div className="flex items-center space-x-2">
      <Button variant="outline" size="sm" asChild>
        <Link href="/admin/login">Admin Login</Link>
      </Button>
      <Button asChild>
        <Link href="/request-service">Hire Us</Link>
      </Button>
    </div>
  )
}