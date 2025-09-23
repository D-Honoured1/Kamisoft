// app/payment/[requestId]/page.tsx - TASK 4: IMPROVED LAYOUT & STYLING
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
  ArrowRight
} from "lucide-react"
import { SERVICE_CATEGORIES } from "@/lib/constants/services"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import type { ServiceRequest } from "@/lib/types/database"

type PaymentMethod = "stripe" | "paystack" | "crypto" | "bank_transfer"
type PaymentType = "split" | "full"

export default function PaymentPage() {
  const params = useParams()
  const requestId = params.requestId as string
  const { isAuthenticated: isAdmin } = useAdminAuth()

  const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>("stripe")
  const [selectedPaymentType, setSelectedPaymentType] = useState<PaymentType>("split")
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accessDenied, setAccessDenied] = useState(false)
  const [linkExpired, setLinkExpired] = useState(false)
  const [adminDiscountPercent, setAdminDiscountPercent] = useState(10)
  const [timeRemaining, setTimeRemaining] = useState<string>("")

  const SPLIT_PAYMENT_PERCENT = 50

  // Previous useEffect hooks remain the same...
  useEffect(() => {
    fetchServiceRequest()
  }, [requestId])

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
          setError("This payment link has expired. Please contact support for a new link.")
        }
      }

      updateTimer()
      const interval = setInterval(updateTimer, 1000)
      
      return () => clearInterval(interval)
    }
  }, [serviceRequest])

  const fetchServiceRequest = async () => {
    // Previous implementation remains the same...
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

      if (data.payment_link_expiry) {
        const expiryTime = new Date(data.payment_link_expiry)
        const currentTime = new Date()
        
        if (currentTime > expiryTime) {
          setLinkExpired(true)
          setError("This payment link has expired. Please contact support for a new link.")
          return
        }
      } else {
        setAccessDenied(true)
        setError("Invalid payment link. Please contact support.")
        return
      }
      
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

      if (data.payments && data.payments.length > 0) {
        const paidPayments = data.payments.filter((p: any) => p.payment_status === "paid")
        if (paidPayments.length > 0) {
          setAccessDenied(true)
          setError("Payment has already been completed for this request")
          return
        }
      }

      if (data.admin_discount_percent !== undefined && data.admin_discount_percent !== null) {
        setAdminDiscountPercent(data.admin_discount_percent)
      } else {
        setAdminDiscountPercent(10)
      }

      setServiceRequest(data)
    } catch (error: any) {
      console.error("Error fetching service request:", error)
      setError(error.message || "Failed to load payment information")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentTypeChange = (value: string) => {
    setSelectedPaymentType(value as PaymentType)
  }

  const handlePaymentMethodChange = (value: string) => {
    setSelectedPaymentMethod(value as PaymentMethod)
  }

  const handlePayment = async () => {
    // Previous implementation remains the same...
    if (!serviceRequest) return

    if (serviceRequest.payment_link_expiry) {
      const expiryTime = new Date(serviceRequest.payment_link_expiry)
      const currentTime = new Date()
      
      if (currentTime > expiryTime) {
        setLinkExpired(true)
        setError("This payment link has expired during processing. Please contact support for a new link.")
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
        throw new Error(responseData.error || "Failed to create payment")
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="container max-w-md mx-auto">
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-3 border-primary border-t-transparent mx-auto mb-4"></div>
              <h3 className="font-semibold text-lg mb-2">Loading Payment</h3>
              <p className="text-muted-foreground">Securing your payment information...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Enhanced Access Denied Screen
  if (accessDenied || linkExpired || (error && !serviceRequest)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-red-900/20 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="container max-w-lg mx-auto">
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-8 text-center space-y-6">
              <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                {linkExpired ? <Clock className="h-10 w-10 text-red-600" /> : <Lock className="h-10 w-10 text-red-600" />}
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-3 text-red-900">
                  {linkExpired ? "Payment Link Expired" : "Access Restricted"}
                </h2>
                <p className="text-red-700 mb-6">{error}</p>
              </div>
              
              <div className="bg-red-50 rounded-xl p-6 text-left">
                <h3 className="font-semibold mb-3 text-red-900 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  {linkExpired ? "Security Feature" : "Why am I seeing this?"}
                </h3>
                <ul className="text-sm text-red-800 space-y-2">
                  {linkExpired ? (
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
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  className="flex-1"
                  size="lg"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const serviceCategory = SERVICE_CATEGORIES[serviceRequest?.service_category as keyof typeof SERVICE_CATEGORIES]
  const totalCost = serviceRequest?.estimated_cost || 0
  const splitAmount = totalCost * (SPLIT_PAYMENT_PERCENT / 100)
  const fullPaymentDiscount = totalCost * (adminDiscountPercent / 100)
  const fullPaymentAmount = totalCost - fullPaymentDiscount
  const currentPaymentAmount = selectedPaymentType === "split" ? splitAmount : fullPaymentAmount

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Enhanced Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-blue-600 rounded-2xl mb-4 shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-3">
              Complete Your Payment
            </h1>
            <p className="text-lg text-muted-foreground">
              Secure checkout for your approved service request
            </p>
            
            {/* Countdown Timer */}
            {timeRemaining && !linkExpired && (
              <div className="mt-4">
                <Alert className="inline-flex items-center bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 max-w-fit mx-auto">
                  <Clock className="h-4 w-4" />
                  <AlertDescription className="text-amber-800 font-medium">
                    Link expires in: <span className="font-bold">{timeRemaining}</span>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {isAdmin && (
              <div className="mt-4">
                <Badge variant="secondary" className="inline-flex items-center gap-2 bg-blue-100 text-blue-800">
                  <User className="h-3 w-3" />
                  Admin Preview Mode
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
            
            {/* Left Column: Order Summary - Better proportions */}
            <div className="xl:col-span-3">
              <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md h-fit">
                <CardHeader className="pb-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-t-lg">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <span className="text-green-800 dark:text-green-200">Approved Service Request</span>
                      <CardDescription className="text-green-600 dark:text-green-400 mt-1">
                        Your project has been approved and is ready for payment
                      </CardDescription>
                    </div>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-8 space-y-8">
                  {/* Project Details */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-bold text-2xl mb-3 text-gray-900 dark:text-white">
                        {serviceRequest?.title}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="px-3 py-1">
                          {serviceCategory?.label}
                        </Badge>
                        <Badge variant={serviceRequest?.request_type === "digital" ? "default" : "outline"} className="px-3 py-1">
                          {serviceRequest?.request_type === "digital" ? "Digital Service" : "On-Site Service"}
                        </Badge>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-3 py-1">
                          ✓ Approved
                        </Badge>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                      <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Project Description</h4>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {serviceRequest?.description}
                      </p>
                    </div>

                    {serviceRequest?.client && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
                        <h4 className="font-semibold mb-4 text-blue-900 dark:text-blue-200">Client Information</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-blue-700 dark:text-blue-400 font-medium">Client:</span>
                            <p className="font-semibold text-blue-900 dark:text-blue-100">{serviceRequest.client.name}</p>
                          </div>
                          <div>
                            <span className="text-blue-700 dark:text-blue-400 font-medium">Email:</span>
                            <p className="font-semibold text-blue-900 dark:text-blue-100">{serviceRequest.client.email}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator className="my-8" />

                  {/* Payment Type Selection - Enhanced */}
                  <div className="space-y-6">
                    <Label className="text-xl font-bold flex items-center gap-3 text-gray-900 dark:text-white">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Calculator className="h-5 w-5 text-primary" />
                      </div>
                      Choose Your Payment Plan
                    </Label>

                    <RadioGroup 
                      value={selectedPaymentType} 
                      onValueChange={handlePaymentTypeChange}
                      className="space-y-4"
                    >
                      {/* Split Payment Option - Enhanced */}
                      <div className={`relative border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                        selectedPaymentType === "split" 
                          ? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20" 
                          : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
                      }`} onClick={() => handlePaymentTypeChange("split")}>
                        <div className="flex items-start space-x-4">
                          <RadioGroupItem value="split" id="split" className="mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <Label htmlFor="split" className="text-lg font-semibold cursor-pointer">
                                Split Payment (50/50)
                              </Label>
                              <Badge variant="outline" className="text-xs">
                                Most Popular
                              </Badge>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                                <span>Pay now:</span>
                                <span className="font-bold text-lg text-primary">${splitAmount.toFixed(2)}</span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <span>On completion:</span>
                                <span className="font-medium">${(totalCost - splitAmount).toFixed(2)}</span>
                              </div>
                              <p className="text-blue-600 dark:text-blue-400 text-xs mt-2 flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                Work begins immediately after payment
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Full Payment Option - Enhanced */}
                      <div className={`relative border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                        selectedPaymentType === "full" 
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg ring-2 ring-green-500/20" 
                          : "border-gray-200 dark:border-gray-700 hover:border-green-500/50"
                      }`} onClick={() => handlePaymentTypeChange("full")}>
                        <div className="flex items-start space-x-4">
                          <RadioGroupItem value="full" id="full" className="mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <Label htmlFor="full" className="text-lg font-semibold cursor-pointer">
                                Full Payment
                              </Label>
                              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                                <Tag className="h-3 w-3 mr-1" />
                                Save {adminDiscountPercent}%
                              </Badge>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg opacity-60">
                                <span>Original price:</span>
                                <span className="line-through">${totalCost.toFixed(2)}</span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <span>Discount ({adminDiscountPercent}%):</span>
                                <span className="text-green-600 font-medium">-${fullPaymentDiscount.toFixed(2)}</span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
                                <span>You pay:</span>
                                <span className="font-bold text-xl text-green-600">${fullPaymentAmount.toFixed(2)}</span>
                              </div>
                              <p className="text-green-600 dark:text-green-400 text-xs mt-2 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                No additional payments required • Project fully paid
                              </p>
                            </div>
                          </div>
                        </div>
                        {selectedPaymentType === "full" && (
                          <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                            SAVE ${fullPaymentDiscount.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </RadioGroup>
                  </div>

                  <Separator className="my-8" />

                  {/* Payment Summary - Enhanced */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6">
                    <h4 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Payment Summary</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-base">
                        <span>Project Total</span>
                        <span className="font-medium">${totalCost.toFixed(2)}</span>
                      </div>
                      
                      {selectedPaymentType === "full" && (
                        <div className="flex justify-between items-center text-green-600">
                          <span>Full Payment Discount ({adminDiscountPercent}%)</span>
                          <span className="font-medium">-${fullPaymentDiscount.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {selectedPaymentType === "split" && (
                        <div className="flex justify-between items-center text-muted-foreground">
                          <span>Remaining (Upon Completion)</span>
                          <span>${(totalCost - splitAmount).toFixed(2)}</span>
                        </div>
                      )}
                      
                      <Separator />
                      <div className="flex justify-between items-center font-bold text-xl">
                        <span>Amount Due Now</span>
                        <span className="text-primary bg-primary/10 px-4 py-2 rounded-lg">
                          ${currentPaymentAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Payment Methods - Better proportions */}
            <div className="xl:col-span-2">
              <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md sticky top-24">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <span>Secure Payment</span>
                      <CardDescription className="mt-1">
                        Choose your preferred payment method
                      </CardDescription>
                    </div>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-6 space-y-6">
                  {/* Current Selection Summary - Enhanced */}
                  <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-2xl p-6 border border-primary/20">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold">Selected Plan:</span>
                      <Badge variant="default" className="px-3 py-1">
                        {selectedPaymentType === "split" ? `${SPLIT_PAYMENT_PERCENT}/${100 - SPLIT_PAYMENT_PERCENT} Split` : `Full (-${adminDiscountPercent}%)`}
                      </Badge>
                    </div>
                    <div className="text-3xl font-bold text-primary mb-2">
                      ${currentPaymentAmount.toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {selectedPaymentType === "split" 
                        ? `${SPLIT_PAYMENT_PERCENT}% of ${totalCost.toFixed(2)} total project cost`
                        : `Full payment with ${fullPaymentDiscount.toFixed(2)} savings`
                      }
                    </div>
                  </div>

                  {/* Payment Method Selection - Enhanced */}
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold">Payment Method</Label>
                    <RadioGroup
                      value={selectedPaymentMethod}
                      onValueChange={handlePaymentMethodChange}
                      className="space-y-3"
                    >
                      {paymentMethods.map((method) => {
                        const Icon = method.icon
                        return (
                          <div
                            key={method.id}
                            className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 hover:shadow-md ${
                              selectedPaymentMethod === method.id 
                                ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20" 
                                : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
                            } ${!method.available ? "opacity-50 cursor-not-allowed" : ""}`}
                            onClick={() => method.available && handlePaymentMethodChange(method.id)}
                          >
                            <div className="flex items-start space-x-3">
                              <RadioGroupItem value={method.id} id={method.id} disabled={!method.available} className="mt-1" />
                              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <Icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Label
                                    htmlFor={method.id}
                                    className={`font-medium ${method.available ? "cursor-pointer" : "cursor-not-allowed"}`}
                                  >
                                    {method.name}
                                  </Label>
                                  {method.recommended && (
                                    <Badge variant="default" className="text-xs">
                                      Recommended
                                    </Badge>
                                  )}
                                  {!method.available && (
                                    <Badge variant="outline" className="text-xs">
                                      Coming Soon
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{method.description}</p>
                                <p className="text-xs text-muted-foreground">
                                  Processing fee: {method.processingFee}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </RadioGroup>
                  </div>

                  {error && (
                    <Alert variant="destructive" className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="font-medium">{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Enhanced Pay Button */}
                  <Button
                    onClick={handlePayment}
                    disabled={isProcessing || !paymentMethods.find((m) => m.id === selectedPaymentMethod)?.available || linkExpired}
                    size="lg"
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5" />
                        Pay ${currentPaymentAmount.toFixed(2)}
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    )}
                  </Button>

                  {/* Security Notice */}
                  <div className="text-center space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span className="font-medium">256-bit SSL encryption</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your payment information is secure and encrypted. By proceeding, you agree to our Terms of Service and Privacy Policy.
                    </p>
                  </div>

                  {isAdmin && (
                    <div className="pt-4 border-t">
                      <Button variant="outline" className="w-full" size="lg" asChild>
                        <a href={`/admin/requests/${requestId}`}>
                          <User className="mr-2 h-4 w-4" />
                          Back to Admin Dashboard
                        </a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}