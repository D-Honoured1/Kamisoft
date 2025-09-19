// components/payment-button.tsx - Simple Payment Button Component
"use client"

import { Button } from "@/components/ui/button"
import { CreditCard, DollarSign } from "lucide-react"
import Link from "next/link"

interface PaymentButtonProps {
  requestId?: string
  amount?: number
  variant?: "default" | "outline" | "secondary"
  size?: "default" | "sm" | "lg"
  className?: string
}

export function PaymentButton({ 
  requestId, 
  amount, 
  variant = "default", 
  size = "default",
  className 
}: PaymentButtonProps) {
  if (requestId) {
    return (
      <Button variant={variant} size={size} className={className} asChild>
        <Link href={`/payment/${requestId}`}>
          <CreditCard className="mr-2 h-4 w-4" />
          {amount ? `Pay $${amount.toFixed(2)}` : 'Make Payment'}
        </Link>
      </Button>
    )
  }

  return (
    <Button variant={variant} size={size} className={className} asChild>
      <Link href="/request-service">
        <DollarSign className="mr-2 h-4 w-4" />
        Get Quote
      </Link>
    </Button>
  )
}