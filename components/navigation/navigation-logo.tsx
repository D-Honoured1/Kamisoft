// components/navigation/navigation-logo.tsx
import Link from "next/link"
import Image from "next/image"

export function NavigationLogo() {
  return (
    <Link href="/" className="flex items-center space-x-2">
      <Image
        src="/logo.svg"
        alt="Kamisoft Logo"
        width={32}
        height={32}
        className="h-8 w-8"
      />
      <span className="text-xl font-bold">Kamisoft</span>
    </Link>
  )
}