// components/admin/logout-button.tsx
"use client"

import { useAdminAuth } from "@/components/providers/admin-auth-provider"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useState } from "react"

export function LogoutButton() {
  const { logout, user } = useAdminAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await logout()
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      {user && (
        <span className="text-sm text-muted-foreground">
          {user.name || user.email}
        </span>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={handleLogout}
        disabled={isLoading}
      >
        <LogOut className="h-4 w-4 mr-2" />
        {isLoading ? "Logging out..." : "Logout"}
      </Button>
    </div>
  )
}
