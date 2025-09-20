import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"
import { useAdminAuth } from "@/hooks/use-admin-auth"

export function AuthButtons() {
  const { user, isAuthenticated, loading, logout } = useAdminAuth()

  if (loading) {
    return <div className="w-32 h-9 bg-muted animate-pulse rounded-md" />
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>{user?.name}</span>
        </div>
        <Button variant="outline" size="sm" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
        <Button asChild>
          <Link href="/admin">Dashboard</Link>
        </Button>
      </div>
    )
  }

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