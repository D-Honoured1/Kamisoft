// components/admin-navigation/admin-user-info.tsx
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useAdminAuth } from "@/hooks/use-admin-auth"

export function AdminUserInfo() {
  const { user, logout } = useAdminAuth()

  return (
    <div className="hidden md:flex items-center space-x-2">
      <span className="text-sm text-muted-foreground">{user?.name}</span>
      <Button variant="outline" size="sm" onClick={logout}>
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    </div>
  )
}