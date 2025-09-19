// components/admin-navigation/admin-logo.tsx
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { usePathname } from "next/navigation"

export function AdminLogo() {
  const pathname = usePathname()
  const isDetailPage = pathname.includes("/admin/") && pathname.split("/").length > 3

  if (isDetailPage) {
    return (
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Link>
      </Button>
    )
  }

  return (
    <Link href="/admin" className="flex items-center space-x-2">
      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
        <span className="text-primary-foreground font-bold">K</span>
      </div>
      <span className="font-bold text-xl">Admin</span>
    </Link>
  )
}
