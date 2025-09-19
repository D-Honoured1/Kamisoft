// components/navigation/navigation-logo.tsx
import Link from "next/link"
import { Shield } from "lucide-react"

export function NavigationLogo() {
  return (
    <Link href="/" className="flex items-center space-x-2">
      <Shield className="h-8 w-8 text-primary" />
      <span className="text-xl font-bold">Kamisoft</span>
    </Link>
  )
}