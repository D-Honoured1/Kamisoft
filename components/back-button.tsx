// components/back-button.tsx
"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface BackButtonProps {
  href?: string
  label?: string
  useRouter?: boolean
}

export function BackButton({ 
  href = "/admin", 
  label = "Back",
  useRouter = false 
}: BackButtonProps) {
  const router = useRouter()

  if (useRouter) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {label}
      </Button>
    )
  }

  return (
    <Button variant="outline" size="sm" asChild className="mb-4">
      <Link href={href}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        {label}
      </Link>
    </Button>
  )
}