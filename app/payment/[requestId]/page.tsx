// app/payment/[requestId]/page.tsx - ENHANCED WITH BETTER ERROR HANDLING
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
  User,
  Lock,
  Calculator,
  Tag,
  Star,
  ArrowRight,
  RefreshCw,
  Wifi,
  WifiOff
} from "lucide-react"
import { SERVICE_CATEGORIES } from "@/lib/constants/services"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import type { ServiceRequest } from "@/lib/types/database"

type PaymentMethod = "stripe" | "paystack" | "crypto" | "bank_transfer"
type PaymentType = "split" | "full"

interface ErrorState {
  type: 'network' | 'server' | 'validation' | 'expired' | 'access' | 'config'
  message: string
  retryable: boolean
  supportContact?: boolean
}

export default function PaymentPage() {
  const params = useParams()
  const requestId = params.requestId as string
  const { isAuthenticated: isAdmin } = useAdminAuth()

  const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>("stripe")
  const [selectedPaymentType, setSelectedPaymentType] = useState<PaymentType>("split")
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<ErrorState | null>(null)
  const [accessDenied, setAccessDenied] = useState(false)
  const [linkExpired, setLinkExpired] = useState(false)
  const [adminDiscountPercent, setAdminDiscountPercent] = useState(10)
  const [timeRemaining, setTimeRemaining] = useState<string>("")
  const [retryCount, setRetryCount] = useState(0)
  const [isOnline, setIsOnline] = useState(true)

  const SPLIT_PAYMENT_PERCENT = 50
  const MAX_RETRIES = 3

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Timer for link expiry
  useEffect(() => {
    if (serviceRequest?.payment_link_expiry) {
      const updateTimer = () => {
        const now = new Date().getTime()
        const expiry = new Date(serviceRequest.payment_link_expiry!).getTime()
        const distance = expiry - now

        if (distance > 0) {
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((distance % (1000 * 60)) / 1000)
          setTimeRemaining(`${minutes}m ${seconds}s`)
        } else {
          setTimeRemaining("Expired")
          setLinkExpired(true)
          setError({
            type: 'expired',
            message: "This payment link has expired for security reasons.",
            retryable: false,
            supportContact: true
          })
        }
      }

      updateTimer()
      const interval = setInterval(updateTimer, 1000)
      
      return () => clearInterval(interval)
    }
  }, [serviceRequest])

  const fetchServiceRequest = async (attempt = 1) => {
    try {
      setError(null)
      console.log(`Fetching service request (attempt ${attempt})...`)
      
      if (!isOnline) {
        throw new Error("NETWORK_OFFLINE")
      }
      
      const response = await fetch(`/api/service-requests/${requestId}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("NOT_FOUND")
        } else if (response.status >= 500) {
          throw new Error("SERVER_ERROR")
        } else {
          throw new Error("API_ERROR")
        }
      }
      
      const data = await response.json()

      // Validate payment link expiry
      if (data.payment_link_expiry) {
        const expiryTime = new Date(data.payment_link_expiry)
        const currentTime = new Date()
        
        if (currentTime > expiryTime) {
          setLinkExpired(true)
          setError({
            type: 'expired',
            message: "This payment link has expired.",
            retryable: false,
            supportContact: true
          })
          return
        }
      } else {
        setAccessDenied(true)
        setError({
          type: 'access',
          message: "Invalid payment link. This link may not have been generated properly.",
          retryable: false,
          supportContact: true
        })
        return
      }
      
      // Validate request status
      if (data.status !== "approved") {
        setAccessDenied(true)
        setError({
          type: 'access',
          message: `Payment not available. Request status: ${data.status}`,
          retryable: false
        })
        return
      }

      // Validate pricing
      if (!data.estimated_cost || data.estimated_cost <= 0) {
        setAccessDenied(true)
        setError({
          type: 'validation',
          message: "No estimated cost set for this request.",
          retryable: false,
          supportContact: true
        })
        return
      }

      // Check for existing payments
      if (data.payments && data.payments.length > 0) {
        const paidPayments = data.payments.filter((p: any) => 
          p.payment_status === "paid" || p.payment_status === "confirmed"
        )
        if (paidPayments.length > 0) {
          setAccessDenied(true)
          setError({
            type: 'access',
            message: "Payment has already been completed for this request.",
            retryable: false
          })
          return
        }
      }

      // Set discount percentage
      if (data.admin_discount_percent !== undefined && data.admin_discount_percent !== null) {
        setAdminDiscountPercent(data.admin_discount_percent)
      } else {
        setAdminDiscountPercent(10)
      }

      setServiceRequest(data)
      setRetryCount(0)
    } catch (error: any) {
      console.error("Error fetching service request:", error)
      
      let errorState: ErrorState

      switch (error.message) {
        case "NETWORK_OFFLINE":
          errorState = {
            type: 'network',
            message: "You're currently offline. Please check your internet connection.",
            retryable: true
          }
          break
        case "NOT_FOUND":
          errorState = {
            type: 'access',
            message: "Service request not found or you don't have access to this payment link.",
            retryable: false,
            supportContact: true
          }
          break
        case "SERVER_ERROR":
          errorState = {
            type: 'server',
            message: "Our payment system is temporarily unavailable. Please try again in a few moments.",
            retryable: true
          }
          break
        default:
          errorState = {
            type: 'network',
            message: "Unable to load payment information. Please check your connection and try again.",
            retryable: attempt < MAX_RETRIES
          }
      }

      setError(errorState)
      
      // Auto-retry for network/server errors
      if (errorState.retryable && attempt < MAX_RETRIES) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000) // Exponential backoff
        setTimeout(() => {
          setRetryCount(attempt)
          fetchServiceRequest(attempt + 1)
        }, delay)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchServiceRequest()
  }, [requestId])

  const handlePayment = async () => {
    if (!serviceRequest) return

    // Final expiry check
    if (serviceRequest.payment_link_expiry) {
      const expiryTime = new Date(serviceRequest.payment_link_expiry)
      const currentTime = new Date()
      
      if (currentTime > expiryTime) {
        setLinkExpired(true)
        setError({
          type: 'expired',
          message: "This payment link expired while you were on the page. Please request a new link.",
          retryable: false,
          supportContact: true
        })
        return
      }
    }

    setIsProcessing(true)
    setError(null)

    try {
      const cost = serviceRequest.estimated_cost || 0
      let paymentAmount: number
      let paymentMetadata: any = {
        payment_type: selectedPaymentType,
        original_amount: cost,
        discount_percent: adminDiscountPercent
      }

      if (selectedPaymentType === "split") {
        paymentAmount = cost * (SPLIT_PAYMENT_PERCENT / 100)
        paymentMetadata = {
          ...paymentMetadata,
          upfront_percent: SPLIT_PAYMENT_PERCENT,
          remaining_amount: cost - paymentAmount,
          description: `${SPLIT_PAYMENT_PERCENT}% upfront payment`
        }
      } else {
        const discountAmount = cost * (adminDiscountPercent / 100)
        paymentAmount = cost - discountAmount
        paymentMetadata = {
          ...paymentMetadata,
          discount_amount: discountAmount,
          savings: discountAmount,
          description: `Full payment with ${adminDiscountPercent}% discount`
        }
      }

      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: serviceRequest.id,
          paymentMethod: selectedPaymentMethod,
          amount: paymentAmount,
          paymentType: selectedPaymentType,
          metadata: paymentMetadata,
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        // Better error handling based on response
        let errorState: ErrorState
        
        if (response.status === 500 && responseData.details?.includes("configuration")) {
          errorState = {
            type: 'config',
            message: "Payment processing is temporarily unavailable. Please try a different payment method or contact support.",
            retryable: true,
            supportContact: true
          }
        } else if (response.status === 400) {
          errorState = {
            type: 'validation',
            message: responseData.error || responseData.details || "Invalid payment information.",
            retryable: false
          }
        } else {
          errorState = {
            type: 'server',
            message: responseData.details || "Payment processing failed. Please try again.",
            retryable: true
          }
        }
        
        setError(errorState)
        return
      }

      const { checkoutUrl, paymentId, message } = responseData

      if (checkoutUrl) {
        window.location.href = checkoutUrl
      } else {
        setError(null)
        alert(message || "Payment instructions will be sent to your email")
      }
    } catch (error: any) {
      console.error("Error processing payment:", error)
      
      let errorState: ErrorState
      if (!isOnline) {
        errorState = {
          type: 'network',
          message: "Lost internet connection. Please check your connection and try again.",
          retryable: true
        }
      } else {
        errorState = {
          type: 'network',
          message: "Failed to process payment due to connection issues. Please try again.",
          retryable: true
        }
      }
      
      setError(errorState)
    } finally {
      setIsProcessing(false)
    }
  }

  const retryAction = () => {
    if (error?.retryable) {
      setIsLoading(true)
      fetchServiceRequest()
    }
  }

  // Enhanced loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="container max-w-md mx-auto">
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-3 border-primary border-t-transparent mx-auto mb-4"></div>
              <h3 className="font-semibold text-lg mb-2">
                {retryCount > 0 ? `Retrying... (${retryCount}/${MAX_RETRIES})` : "Loading Payment"}
              </h3>
              <p className="text-muted-foreground">
                {!isOnline ? "Waiting for connection..." : "Securing your payment information..."}
              </p>
              {!isOnline && (
                <div className="flex items-center justify-center gap-2 mt-4 text-amber-600">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-sm">No internet connection</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Enhanced error screen
  if (error && (accessDenied || linkExpired || error.type === 'access')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-red-900/20 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="container max-w-lg mx-auto">
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-8 text-center space-y-6">
              <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                {error.type === 'expired' ? 
                  <Clock className="h-10 w-10 text-red-600" /> : 
                  <Lock className="h-10 w-10 text-red-600" />
                }
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-3 text-red-900">
                  {error.type === 'expired' ? "Payment Link Expired" : "Access Restricted"}
                </h2>
                <p className="text-red-700 mb-6">{error.message}</p>
              </div>
              
              <div className="bg-red-50 rounded-xl p-6 text-left">
                <h3 className="font-semibold mb-3 text-red-900 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  {error.type === 'expired' ? "Security Feature" : "Why am I seeing this?"}
                </h3>
                <ul className="text-sm text-red-800 space-y-2">
                  {error.type === 'expired' ? (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-red-600 mt-1">•</span>
                        <span>Payment links expire after 1 hour for your security</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-600 mt-1">•</span>
                        <span>This prevents unauthorized access to your payment</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-600 mt-1">•</span>
                        <span>Request a fresh payment link from support</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-red-600 mt-1">•</span>
                        <span>Payment links are only active for approved requests</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-600 mt-1">•</span>
                        <span>The request must have pricing set by our team</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-600 mt-1">•</span>
                        <span>Payment may already be completed</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {isAdmin ? (
                  <Button asChild className="flex-1" size="lg">
                    <a href={`/admin/requests/${requestId}`}>
                      <User className="mr-2 h-4 w-4" />
                      View in Admin
                    </a>
                  </Button>
                ) : (
                  <Button asChild className="flex-1" size="lg">
                    <a href="/contact">
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Contact Support
                    </a>
                  </Button>
                )}
                {error.retryable && (
                  <Button 
                    variant="outline" 
                    onClick={retryAction}
                    className="flex-1"
                    size="lg"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                )}
              </div>

              {error.supportContact && (
                <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                  <p>
                    Need immediate assistance? Contact us at{" "}
                    <a href="mailto:hello@kamisoftenterprises.online" className="text-primary hover:underline">
                      hello@kamisoftenterprises.online
                    </a>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Rest of your component remains the same, but now with enhanced error handling
  // Add error display in the main payment interface
  const serviceCategory = SERVICE_CATEGORIES[serviceRequest?.service_category as keyof typeof SERVICE_CATEGORIES]
  const totalCost = serviceRequest?.estimated_cost || 0
  const splitAmount = totalCost * (SPLIT_PAYMENT_PERCENT / 100)
  const fullPaymentDiscount = totalCost * (adminDiscountPercent / 100)
  const fullPaymentAmount = totalCost - fullPaymentDiscount
  const currentPaymentAmount = selectedPaymentType === "split" ? splitAmount : fullPaymentAmount

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Network status indicator */}
      {!isOnline && (
        <div className="bg-red-500 text-white text-center py-2 text-sm">
          <WifiOff className="inline h-4 w-4 mr-2" />
          No internet connection - Please check your connection
        </div>
      )}

      {/* Enhanced Error Display */}
      {error && error.retryable && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-amber-400 mr-3" />
            <div className="flex-1">
              <p className="text-sm text-amber-800">{error.message}</p>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={retryAction}
              className="ml-4"
              disabled={isProcessing}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Your existing payment interface continues here... */}
      {serviceRequest && (
        <div>
          {/* Header and payment interface - same as before */}
          {/* Add your existing payment interface here */}
        </div>
      )}
    </div>
  )
}