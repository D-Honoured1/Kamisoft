// app/payment/[requestId]/page.tsx - NIGERIA-FOCUSED VERSION WITH NAIRA DISPLAY
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
  Building, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Shield,
  User,
  Lock,
  Calculator,
  Tag,
  Star,
  ArrowRight,
  RefreshCw,
  Smartphone,
  DollarSign,
  Copy,
  ExternalLink
} from "lucide-react"
import { SERVICE_CATEGORIES } from "@/lib/constants/services"

type PaymentMethod = "paystack" | "bank_transfer" | "nowpayments"
type PaymentType = "split" | "full"

interface ServiceRequest {
  id: string
  title: string
  description: string
  service_category: string
  status: string
  estimated_cost: number
  admin_discount_percent?: number
  payment_link_expiry?: string
  clients: {
    id: string
    name: string
    email: string
    company?: string
  }
  payments?: Array<{
    id: string
    amount: number
    payment_status: string
    payment_method: string
  }>
}

interface CryptoInfo {
  currency: string
  network: string
  address: string
  amount: number
  ngnEquivalent: string
  qrCode: string
  instructions: string[]
  supportedNetworks: Array<{
    name: string
    fee: string
    recommended: boolean
  }>
}

interface BankDetails {
  bankName: string
  accountNumber: string
  accountName: string
  sortCode: string
  amount: number
  ngnAmount: string
  currency: string
  reference: string
  instructions: string[]
}

export default function PaymentPage() {
  const params = useParams()
  const requestId = params.requestId as string

  // Exchange rate - fetch from centralized API
  const [exchangeRate, setExchangeRate] = useState(1550) // NGN per USD (initial fallback)
  const [exchangeRateSource, setExchangeRateSource] = useState<string>('loading')

  const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>("paystack")
  const [selectedPaymentType, setSelectedPaymentType] = useState<PaymentType>("split")
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>("")
  const [cryptoInfo, setCryptoInfo] = useState<CryptoInfo | null>(null)
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null)

  const SPLIT_PAYMENT_PERCENT = 50
  const DEFAULT_DISCOUNT_PERCENT = 10

  useEffect(() => {
    fetchServiceRequest()
    // In production, fetch current exchange rate
    fetchExchangeRate()
  }, [requestId])

  useEffect(() => {
    if (!serviceRequest?.payment_link_expiry) return

    const updateTimer = () => {
      const now = new Date().getTime()
      const expiry = new Date(serviceRequest.payment_link_expiry!).getTime()
      const distance = expiry - now

      if (distance > 0) {
        const hours = Math.floor(distance / (1000 * 60 * 60))
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
        setTimeRemaining(hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`)
      } else {
        setTimeRemaining("Expired")
        setError("This payment link has expired. Please contact support for a new link.")
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [serviceRequest])

  const fetchExchangeRate = async () => {
    try {
      const response = await fetch('/api/exchange-rate')
      const data = await response.json()

      if (data.success && data.usdToNgn) {
        setExchangeRate(data.usdToNgn)
        setExchangeRateSource(data.source || 'api')
        console.log(`Exchange rate updated: 1 USD = ${data.usdToNgn} NGN (${data.source})`)
      } else {
        setExchangeRateSource('fallback')
      }
    } catch (error) {
      console.error("Failed to fetch exchange rate:", error)
      setExchangeRateSource('error-fallback')
    }
  }

  const fetchServiceRequest = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/service-requests/${requestId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Service request not found or you don't have access to this payment link.")
          return
        }
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()

      if (data.status !== "approved") {
        setError(`Payment not available. Request status: ${data.status}`)
        return
      }

      if (!data.estimated_cost || data.estimated_cost <= 0) {
        setError("No pricing information available for this request.")
        return
      }

      if (data.payment_link_expiry) {
        const expiryTime = new Date(data.payment_link_expiry)
        const currentTime = new Date()
        
        if (currentTime > expiryTime) {
          setError("This payment link has expired. Please contact support for a new link.")
          return
        }
      }

      if (data.payments?.some((p: any) => 
        p.payment_status === "paid" || 
        p.payment_status === "confirmed" || 
        p.payment_status === "completed"
      )) {
        setError("Payment has already been completed for this request.")
        return
      }

      setServiceRequest(data)
    } catch (error) {
      console.error("Error fetching service request:", error)
      setError("Failed to load payment information. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!serviceRequest) return

    if (serviceRequest.payment_link_expiry) {
      const expiryTime = new Date(serviceRequest.payment_link_expiry)
      const currentTime = new Date()
      
      if (currentTime > expiryTime) {
        setError("This payment link expired. Please contact support.")
        return
      }
    }

    setIsProcessing(true)
    setError(null)
    setCryptoInfo(null)
    setBankDetails(null)

    try {
      const cost = serviceRequest.estimated_cost
      const discountPercent = serviceRequest.admin_discount_percent || DEFAULT_DISCOUNT_PERCENT

      // Calculate existing payments
      const existingPayments = serviceRequest.payments?.filter(p =>
        p.payment_status === 'completed' || p.payment_status === 'confirmed'
      ) || []
      const totalPaid = existingPayments.reduce((sum, payment) => sum + payment.amount, 0)
      const remainingBalance = cost - totalPaid

      let paymentAmount: number
      let description: string

      if (selectedPaymentType === "split") {
        if (totalPaid === 0) {
          // First payment (50%)
          paymentAmount = cost * (SPLIT_PAYMENT_PERCENT / 100)
          description = `${SPLIT_PAYMENT_PERCENT}% upfront payment (1 of 2)`
        } else {
          // Second payment (remaining balance)
          paymentAmount = remainingBalance
          description = `Final payment (2 of 2) - Balance: $${remainingBalance.toFixed(2)}`
        }
      } else {
        if (totalPaid > 0) {
          setError(`Payment already exists. Remaining balance: $${remainingBalance.toFixed(2)}`)
          return
        }
        const discountAmount = cost * (discountPercent / 100)
        paymentAmount = cost - discountAmount
        description = `Full payment with ${discountPercent}% discount`
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
          metadata: { description }
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.details || "Payment processing failed")
      }

      const result = await response.json()

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl
      } else if (result.cryptoInfo) {
        setCryptoInfo(result.cryptoInfo)
      } else if (result.bankDetails) {
        setBankDetails(result.bankDetails)
      } else if (result.message) {
        alert(result.message)
      }
    } catch (error: any) {
      console.error("Payment error:", error)
      setError(error.message || "Failed to process payment. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("Copied to clipboard!")
  }

  // Loading and error states...
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-primary border-t-transparent mx-auto mb-4"></div>
            <h3 className="font-semibold text-lg mb-2">Loading Payment</h3>
            <p className="text-muted-foreground">Securing your payment information...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-red-900/20 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm max-w-lg w-full">
          <CardContent className="p-8 text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <Lock className="h-10 w-10 text-red-600" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-3 text-red-900">Payment Unavailable</h2>
              <p className="text-red-700 mb-6">{error}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={fetchServiceRequest}
                className="flex-1" 
                size="lg"
                disabled={isLoading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button asChild variant="outline" className="flex-1" size="lg">
                <a href="/contact">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Contact Support
                </a>
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground pt-4 border-t">
              <p>
                Need help? Email us at{" "}
                <a href="mailto:support@kamisoftenterprises.online" className="text-primary hover:underline">
                  support@kamisoftenterprises.online
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!serviceRequest) return null

  const serviceCategory = SERVICE_CATEGORIES[serviceRequest.service_category as keyof typeof SERVICE_CATEGORIES]
  const totalCost = serviceRequest.estimated_cost
  const discountPercent = serviceRequest.admin_discount_percent || DEFAULT_DISCOUNT_PERCENT

  // Calculate existing payments
  const existingPayments = serviceRequest.payments?.filter(p =>
    p.payment_status === 'completed' || p.payment_status === 'confirmed'
  ) || []
  const totalPaid = existingPayments.reduce((sum, payment) => sum + payment.amount, 0)
  const remainingBalance = totalCost - totalPaid
  const hasPartialPayment = totalPaid > 0 && remainingBalance > 0
  const isFullyPaid = totalPaid >= totalCost

  const splitAmount = totalCost * (SPLIT_PAYMENT_PERCENT / 100)
  const fullPaymentDiscount = totalCost * (discountPercent / 100)
  const fullPaymentAmount = totalCost - fullPaymentDiscount

  // Adjust amounts based on existing payments
  let currentPaymentAmount: number
  let isRemainingBalancePayment = false

  if (hasPartialPayment) {
    // This is a remaining balance payment
    currentPaymentAmount = remainingBalance
    isRemainingBalancePayment = true
  } else {
    // Normal payment (no existing payments)
    currentPaymentAmount = selectedPaymentType === "split" ? splitAmount : fullPaymentAmount
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">
                {isRemainingBalancePayment ? "Final Payment" : "Secure Payment"}
              </h1>
            </div>
            <p className="text-muted-foreground">
              {isRemainingBalancePayment
                ? `Complete your remaining balance payment for ${serviceRequest.title}`
                : `Complete your payment for ${serviceRequest.title}`
              }
            </p>
            {isRemainingBalancePayment && (
              <div className="mt-2 flex items-center justify-center gap-2 text-sm text-blue-600">
                <CheckCircle className="h-4 w-4" />
                <span>You have already paid ${totalPaid.toFixed(2)} • Balance: ${remainingBalance.toFixed(2)}</span>
              </div>
            )}
            {timeRemaining && timeRemaining !== "Expired" && (
              <div className="mt-2 flex items-center justify-center gap-2 text-sm text-amber-600">
                <Clock className="h-4 w-4" />
                <span>Link expires in {timeRemaining}</span>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Service Details - Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Service Request
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">{serviceRequest.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {serviceRequest.description.length > 100 
                        ? `${serviceRequest.description.substring(0, 100)}...`
                        : serviceRequest.description
                      }
                    </p>
                    <Badge variant="outline" className="mb-3">
                      {serviceCategory?.name || serviceRequest.service_category}
                    </Badge>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Client Information</h4>
                    <div className="text-sm space-y-1">
                      <p>{serviceRequest.clients.name}</p>
                      <p className="text-muted-foreground">{serviceRequest.clients.email}</p>
                      {serviceRequest.clients.company && (
                        <p className="text-muted-foreground">{serviceRequest.clients.company}</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Pricing</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Project Cost:</span>
                        <div className="text-right">
                          <div className="font-medium">${totalCost.toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">
                            ≈ ₦{(totalCost * exchangeRate).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      {selectedPaymentType === "full" && (
                        <>
                          <div className="flex justify-between text-green-600">
                            <span className="text-sm">Full Payment Discount ({discountPercent}%):</span>
                            <div className="text-right">
                              <div>-${fullPaymentDiscount.toFixed(2)}</div>
                              <div className="text-xs">-₦{(fullPaymentDiscount * exchangeRate).toLocaleString()}</div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="font-medium">You Pay:</span>
                            <div className="text-right">
                              <span className="text-2xl font-bold text-green-600">
                                ${fullPaymentAmount.toFixed(2)}
                              </span>
                              <div className="text-lg text-green-600 font-semibold">
                                ₦{(fullPaymentAmount * exchangeRate).toLocaleString()}
                              </div>
                              <div className="text-sm text-green-600">
                                You save ₦{(fullPaymentDiscount * exchangeRate).toLocaleString()}!
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                      {selectedPaymentType === "split" && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-blue-600">
                            <span className="text-sm">Upfront Payment (50%):</span>
                            <div className="text-right">
                              <div className="font-medium">${splitAmount.toFixed(2)}</div>
                              <div className="text-sm">₦{(splitAmount * exchangeRate).toLocaleString()}</div>
                            </div>
                          </div>
                          <div className="flex justify-between text-muted-foreground text-sm">
                            <span>Remaining (due on completion):</span>
                            <div className="text-right">
                              <div>${splitAmount.toFixed(2)}</div>
                              <div>₦{(splitAmount * exchangeRate).toLocaleString()}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                    Exchange rate: $1 = ₦{exchangeRate.toLocaleString()} (updated hourly)
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Options */}
            <div className="lg:col-span-2">
              {/* Payment Type Selection or Remaining Balance */}
              {isRemainingBalancePayment ? (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Remaining Balance Payment
                    </CardTitle>
                    <CardDescription>
                      Complete your final payment for this service
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Payment History Summary */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg mb-6">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Payment Progress
                      </h4>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                          <div className="text-lg font-bold text-green-600">${totalPaid.toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">Already Paid</div>
                          <div className="text-sm text-green-600">₦{(totalPaid * exchangeRate).toLocaleString()}</div>
                        </div>
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                          <div className="text-lg font-bold text-orange-600">${remainingBalance.toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">Balance Due</div>
                          <div className="text-sm text-orange-600">₦{(remainingBalance * exchangeRate).toLocaleString()}</div>
                        </div>
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                          <div className="text-lg font-bold text-blue-600">${totalCost.toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">Total Project</div>
                          <div className="text-sm text-blue-600">₦{(totalCost * exchangeRate).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>

                    {/* Final Payment Amount */}
                    <div className="p-6 border-2 border-orange-200 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-3 mb-3">
                          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <DollarSign className="h-5 w-5 text-orange-600" />
                          </div>
                          <span className="font-semibold text-lg">Final Payment Amount</span>
                        </div>
                        <div className="space-y-2">
                          <div className="text-4xl font-bold text-orange-600">
                            ${remainingBalance.toFixed(2)}
                          </div>
                          <div className="text-2xl font-semibold text-orange-600">
                            ₦{(remainingBalance * exchangeRate).toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Complete payment to finish your project
                          </div>
                        </div>
                      </div>
                    </div>

                    <Alert className="mt-4">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        This is your final payment. After completion, your project will be fully paid and ready for delivery.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              ) : (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Payment Option
                    </CardTitle>
                    <CardDescription>
                      Choose how you'd like to pay for this service
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={selectedPaymentType}
                      onValueChange={(value) => setSelectedPaymentType(value as PaymentType)}
                    >
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Split Payment */}
                        <div className="relative">
                          <RadioGroupItem value="split" id="split" className="peer sr-only" />
                          <Label
                            htmlFor="split"
                            className="flex flex-col p-6 border-2 rounded-lg cursor-pointer hover:bg-accent peer-checked:border-primary peer-checked:bg-primary/5"
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <CreditCard className="h-5 w-5 text-blue-600" />
                              </div>
                              <span className="font-semibold">Split Payment</span>
                            </div>
                            <div className="space-y-2">
                              <div className="text-2xl font-bold text-blue-600">
                                ${splitAmount.toFixed(2)}
                              </div>
                              <div className="text-lg font-semibold text-blue-600">
                                ₦{(splitAmount * exchangeRate).toLocaleString()}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Pay 50% now, 50% on completion
                              </div>
                              <ul className="text-xs text-muted-foreground space-y-1">
                                <li>• Lower upfront cost</li>
                                <li>• Pay remaining when satisfied</li>
                                <li>• Standard project terms</li>
                              </ul>
                            </div>
                          </Label>
                        </div>

                        {/* Full Payment */}
                        <div className="relative">
                          <RadioGroupItem value="full" id="full" className="peer sr-only" />
                          <Label
                            htmlFor="full"
                            className="flex flex-col p-6 border-2 rounded-lg cursor-pointer hover:bg-accent peer-checked:border-primary peer-checked:bg-primary/5"
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <Tag className="h-5 w-5 text-green-600" />
                              </div>
                              <span className="font-semibold">Full Payment</span>
                              <Badge className="bg-green-100 text-green-800">
                                <Star className="w-3 h-3 mr-1" />
                                Save {discountPercent}%
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <div className="text-2xl font-bold text-green-600">
                                ${fullPaymentAmount.toFixed(2)}
                              </div>
                              <div className="text-lg font-semibold text-green-600">
                                ₦{(fullPaymentAmount * exchangeRate).toLocaleString()}
                              </div>
                              <div className="text-sm text-green-600">
                                You save ₦{(fullPaymentDiscount * exchangeRate).toLocaleString()}
                              </div>
                              <ul className="text-xs text-muted-foreground space-y-1">
                                <li>• {discountPercent}% discount applied</li>
                                <li>• No remaining balance</li>
                                <li>• Priority project handling</li>
                              </ul>
                            </div>
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
              )}

              {/* Payment Methods - NIGERIA FOCUSED */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                  <CardDescription>
                    Choose your preferred payment method
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup 
                    value={selectedPaymentMethod} 
                    onValueChange={(value) => setSelectedPaymentMethod(value as PaymentMethod)}
                    className="space-y-4"
                  >
                    {/* Paystack - PRIMARY METHOD FOR NIGERIA */}
                    <div className="flex items-center space-x-3 p-4 border rounded-lg">
                      <RadioGroupItem value="paystack" id="paystack" />
                      <Label htmlFor="paystack" className="flex items-center gap-3 cursor-pointer flex-1">
                        <CreditCard className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="font-medium">Paystack - Cards & Bank Transfer</div>
                          <div className="text-sm text-muted-foreground">
                            Visa, MasterCard, Verve, Bank Transfer, USSD • Secure Nigerian payments
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Recommended</Badge>
                      </Label>
                    </div>

                    {/* Cryptocurrency */}
                    <div className="flex items-center space-x-3 p-4 border rounded-lg">
                      <RadioGroupItem value="nowpayments" id="nowpayments" />
                      <Label htmlFor="nowpayments" className="flex items-center gap-3 cursor-pointer flex-1">
                        <DollarSign className="h-5 w-5 text-orange-600" />
                        <div>
                          <div className="font-medium">Cryptocurrency (USDT)</div>
                          <div className="text-sm text-muted-foreground">
                            USDT on TRC20 network • Low fees, fast confirmation
                          </div>
                        </div>
                        <Badge variant="secondary">Active</Badge>
                      </Label>
                    </div>

                    {/* Manual Bank Transfer */}
                    <div className="flex items-center space-x-3 p-4 border rounded-lg">
                      <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                      <Label htmlFor="bank_transfer" className="flex items-center gap-3 cursor-pointer flex-1">
                        <Building className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium">Direct Bank Transfer</div>
                          <div className="text-sm text-muted-foreground">
                            Manual transfer to our USD account • 24hr verification
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>

                  {/* Nigerian Currency Notice */}
                  <Alert className="mt-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Secure payment processing through Paystack. Current rate: $1 = ₦{exchangeRate.toLocaleString()}
                    </AlertDescription>
                  </Alert>

                  {/* Payment Summary */}
                  <div className="mt-8 p-6 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-semibold">Payment Summary</span>
                      <Badge variant="outline">
                        {selectedPaymentType === "split" ? "50% Upfront" : "Full Payment"}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Service:</span>
                        <span>{serviceRequest.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Project Cost:</span>
                        <div className="text-right">
                          <div>${totalCost.toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">₦{(totalCost * exchangeRate).toLocaleString()}</div>
                        </div>
                      </div>
                      {selectedPaymentType === "full" && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount ({discountPercent}%):</span>
                          <div className="text-right">
                            <div>-${fullPaymentDiscount.toFixed(2)}</div>
                            <div className="text-xs">-₦{(fullPaymentDiscount * exchangeRate).toLocaleString()}</div>
                          </div>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Amount to Pay:</span>
                        <div className="text-right">
                          <div>${currentPaymentAmount.toFixed(2)}</div>
                          <div className="text-base text-primary">
                            ₦{(currentPaymentAmount * exchangeRate).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Crypto Payment Info Display */}
                  {cryptoInfo && (
                    <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 rounded-lg">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        USDT Payment Details
                      </h4>
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Payment Address</Label>
                            <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border font-mono text-sm break-all">
                              <span className="flex-1">{cryptoInfo.address}</span>
                              <Button size="sm" variant="outline" onClick={() => copyToClipboard(cryptoInfo.address)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-center">
                            <img 
                              src={cryptoInfo.qrCode} 
                              alt="Payment QR Code" 
                              className="w-32 h-32 border rounded-lg"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border">
                            <div className="font-semibold">{cryptoInfo.amount} USDT</div>
                            <div className="text-xs text-muted-foreground">Amount</div>
                          </div>
                          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border">
                            <div className="font-semibold">{cryptoInfo.network}</div>
                            <div className="text-xs text-muted-foreground">Network</div>
                          </div>
                          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border">
                            <div className="font-semibold">₦{cryptoInfo.ngnEquivalent}</div>
                            <div className="text-xs text-muted-foreground">NGN Equivalent</div>
                          </div>
                        </div>

                        <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-blue-800 dark:text-blue-200">
                            <div className="space-y-1">
                              {cryptoInfo.instructions.map((instruction, index) => (
                                <div key={index} className="text-sm">• {instruction}</div>
                              ))}
                            </div>
                          </AlertDescription>
                        </Alert>

                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => window.open(`https://tronscan.org/#/address/${cryptoInfo.address}`, '_blank')}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View on TronScan
                          </Button>
                          <Button variant="outline" onClick={() => copyToClipboard(cryptoInfo.address)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Address
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bank Transfer Details Display */}
                  {bankDetails && (
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Bank Transfer Details
                      </h4>
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs text-muted-foreground">Bank Name</Label>
                              <div className="font-semibold">{bankDetails.bankName}</div>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Account Name</Label>
                              <div className="font-semibold">{bankDetails.accountName}</div>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Account Number</Label>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-semibold">{bankDetails.accountNumber}</span>
                                <Button size="sm" variant="outline" onClick={() => copyToClipboard(bankDetails.accountNumber)}>
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs text-muted-foreground">Amount</Label>
                              <div className="font-semibold">${bankDetails.amount.toFixed(2)} USD</div>
                              <div className="text-sm text-muted-foreground">≈ ₦{bankDetails.ngnAmount}</div>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Reference</Label>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm">{bankDetails.reference}</span>
                                <Button size="sm" variant="outline" onClick={() => copyToClipboard(bankDetails.reference)}>
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200">
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription className="text-green-800 dark:text-green-200">
                            <div className="space-y-1">
                              {bankDetails.instructions.map((instruction, index) => (
                                <div key={index} className="text-sm">• {instruction}</div>
                              ))}
                            </div>
                          </AlertDescription>
                        </Alert>
                      </div>
                    </div>
                  )}

                  {/* Payment Button */}
                  {!cryptoInfo && !bankDetails && (
                    <Button
                      onClick={handlePayment}
                      disabled={isProcessing}
                      className="w-full mt-6"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Processing Payment...
                        </>
                      ) : selectedPaymentMethod === "nowpayments" ? (
                        <>
                          <DollarSign className="mr-2 h-5 w-5" />
                          Generate USDT Payment
                        </>
                      ) : selectedPaymentMethod === "bank_transfer" ? (
                        <>
                          <Building className="mr-2 h-5 w-5" />
                          Get Bank Details
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-5 w-5" />
                          Pay ₦{(currentPaymentAmount * exchangeRate).toLocaleString()} with Paystack
                        </>
                      )}
                    </Button>
                  )}

                  <div className="mt-4 text-center text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Shield className="h-4 w-4" />
                      <span>Your payment is secured with bank-grade encryption</span>
                    </div>
                    <p>
                      Exchange rate updates hourly. By proceeding, you agree to our terms of service.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}