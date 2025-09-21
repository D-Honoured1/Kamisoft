// app/payment/[requestId]/page.tsx - SECURE VERSION WITH ACCESS CONTROL
"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CreditCard, 
  Wallet, 
  Bitcoin, 
  Building, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Shield,
  ExternalLink,
  Info,
  User,
  Lock
} from "lucide-react"
import { SERVICE_CATEGORIES } from "@/lib/constants/services"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import type { ServiceRequest } from "@/lib/types/database"

type PaymentMethod = "stripe" | "paystack" | "crypto" | "bank_transfer"

export default function PaymentPage() {
  const params = useParams()
  const requestId = params.requestId as string
  const { isAuthenticated: isAdmin } = useAdminAuth()

  const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>("stripe")
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    fetchServiceRequest()
  }, [requestId])

  const fetchServiceRequest = async () => {
    try {
      console.log("Fetching service request for payment:", requestId)
      
      const response = await fetch(`/api/service-requests/${requestId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Service request not found")
        }
        throw new Error(`Failed to fetch service request: ${response.status}`)
      }
      
      const data = await response.json()
      console.log("Service request data:", data)
      
      // Check if payment is allowed
      if (data.status !== "approved") {
        setAccessDenied(true)
        setError(`Payment not available. Request status: ${data.status}`)
        return
      }

      if (!data.estimated_cost || data.estimated_cost <= 0) {
        setAccessDenied(true)
        setError("No estimated cost set for this request")
        return
      }

      // Check if payment already exists
      if (data.payments && data.payments.length > 0) {
        const paidPayments = data.payments.filter((p: any) => p.payment_status === "paid")
        if (paidPayments.length > 0) {
          setAccessDenied(true)
          setError("Payment has already been completed for this request")
          return
        }
      }

      setServiceRequest(data)
    } catch (error: any) {
      console.error("Error fetching service request:", error)
      setError(error.message || "Failed to load payment information")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!serviceRequest) return

    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: serviceRequest.id,
          paymentMethod: selectedPaymentMethod,
          amount: serviceRequest.estimated_cost || 0,
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to create payment")
      }

      const { checkoutUrl, paymentId, message } = responseData

      if (checkoutUrl) {
        // Redirect to payment provider
        window.location.href = checkoutUrl
      } else {
        // Handle bank transfer - show success message
        setError(null)
        alert(message || "Payment instructions will be sent to your email")
      }
    } catch (error: any) {
      console.error("Error processing payment:", error)
      setError(error.message || "Failed to process payment. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const paymentMethods = [
    {
      id: "stripe" as PaymentMethod,
      name: "Credit/Debit Card",
      description: "Pay securely with Visa, Mastercard, or American Express",
      icon: CreditCard,
      available: true,
      recommended: true,
      processingFee: "2.9% + $0.30",
    },
    {
      id: "paystack" as PaymentMethod,
      name: "Paystack", 
      description: "Nigerian cards, bank transfer, USSD, and mobile money",
      icon: Wallet,
      available: true,
      recommended: false,
      processingFee: "1.5% + ₦100",
    },
    {
      id: "bank_transfer" as PaymentMethod,
      name: "Bank Transfer",
      description: "Direct bank transfer (manual verification within 24 hours)",
      icon: Building,
      available: true,
      recommended: false,
      processingFee: "Free",
    },
    {
      id: "crypto" as PaymentMethod,
      name: "Cryptocurrency",
      description: "Pay with Bitcoin, Ethereum, or other cryptocurrencies",
      icon: Bitcoin,
      available: false,
      recommended: false,
      processingFee: "1.0%",
    },
  ]