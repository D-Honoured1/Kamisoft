// app/payment/[requestId]/page.tsx - SIMPLIFIED AND FIXED VERSION
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
  RefreshCw
} from "lucide-react"
import { SERVICE_CATEGORIES } from "@/lib/constants/services"

type PaymentMethod = "stripe" | "paystack" | "bank_transfer"
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

export default function PaymentPage() {
  const params = useParams()
  const requestId = params.requestId as string

  const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>("stripe")
  const [selectedPaymentType, setSelectedPaymentType] = useState<PaymentType>("split")
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>("")

  const SPLIT_PAYMENT_PERCENT = 50
  const DEFAULT_DISCOUNT_PERCENT = 10

  useEffect(() => {
    fetchServiceRequest()
  }, [requestId])

  // Timer for link expiry
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

      // Basic validation
      if (data.status !== "approved") {
        setError(`Payment not available. Request status: ${data.status}`)
        return
      }

      if (!data.estimated_cost || data.estimated_cost <= 0) {
        setError("No pricing information available for this request.")
        return
      }

      // Check if payment link has expired
      if (data.payment_link_expiry) {
        const expiryTime = new Date(data.payment_link_expiry)
        const currentTime = new Date()
        
        if (currentTime > expiryTime) {
          setError("This payment link has expired. Please contact support for a new link.")
          return
        }
      }

      // Check for existing successful payments
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

    // Check expiry before processing
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

    try {
      const cost = serviceRequest.estimated_cost
      const discountPercent = serviceRequest.admin_discount_percent || DEFAULT_DISCOUNT_PERCENT
      
      let paymentAmount: number
      let description: string

      if (selectedPaymentType === "split") {
        paymentAmount = cost * (SPLIT_PAYMENT_PERCENT / 100)
        description = `${SPLIT_PAYMENT_PERCENT}% upfront payment`
      } else {
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

      const { checkoutUrl, message } = await response.json()

      if (checkoutUrl) {
        window.location.href = checkoutUrl
      } else if (message) {
        alert(message)
      }
    } catch (error: any) {
      console.error("Payment error:", error)
      setError(error.message || "Failed to process payment. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
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

  // Error state
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
                <a href="mailto:hello@kamisoftenterprises.online" className="text-primary hover:underline">
                  hello@kamisoftenterprises.online
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main payment interface
  if (!serviceRequest) return null

  const serviceCategory = SERVICE_CATEGORIES[serviceRequest.service_category as keyof typeof SERVICE_CATEGORIES]
  const totalCost = serviceRequest.estimated_cost
  const discountPercent = serviceRequest.admin_discount_percent || DEFAULT_DISCOUNT_PERCENT
  const splitAmount = totalCost * (SPLIT_PAYMENT_PERCENT / 100)
  const fullPaymentDiscount = totalCost * (discountPercent / 100)
  const fullPaymentAmount = totalCost - fullPaymentDiscount
  const currentPaymentAmount = selectedPaymentType === "split" ? splitAmount : fullPaymentAmount

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Secure Payment</h1>
            </div>
            <p className="text-muted-foreground">
              Complete your payment for {serviceRequest.title}
            </p>
            {timeRemaining && timeRemaining !== "Expired" && (
              <div className="mt-2 flex items-center justify-center gap-2 text-sm text-amber-600">
                <Clock className="h-4 w-4" />
                <span>Link expires in {timeRemaining}</span>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Service Details */}
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
                        <span className="text-sm">Estimated Cost:</span>
                        <span className="font-medium">${totalCost.toFixed(2)}</span>
                      </div>
                      {selectedPaymentType === "full" && (
                        <>
                          <div className="flex justify-between text-green-600">
                            <span className="text-sm">Full Payment Discount ({discountPercent}%):</span>
                            <span>-${fullPaymentDiscount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="font-medium">You Pay:</span>
                            <div className="text-right">
                              <span className="text-2xl font-bold text-green-600">
                                ${fullPaymentAmount.toFixed(2)}
                              </span>
                              <div className="text-sm text-green-600">
                                You save ${fullPaymentDiscount.toFixed(2)}!
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                      {selectedPaymentType === "split" && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-blue-600">
                            <span className="text-sm">Upfront Payment (50%):</span>
                            <span className="font-medium">${splitAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground text-sm">
                            <span>Remaining (due on completion):</span>
                            <span>${splitAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Options */}
            <div className="lg:col-span-2">
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
                            <div className="text-sm text-green-600">
                              You save ${fullPaymentDiscount.toFixed(2)}
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

              {/* Payment Methods */}
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
                    {/* Stripe */}
                    <div className="flex items-center space-x-3 p-4 border rounded-lg">
                      <RadioGroupItem value="stripe" id="stripe" />
                      <Label htmlFor="stripe" className="flex items-center gap-3 cursor-pointer flex-1">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium">Credit/Debit Card</div>
                          <div className="text-sm text-muted-foreground">
                            Visa, MasterCard, American Express • Powered by Stripe
                          </div>
                        </div>
                      </Label>
                    </div>

                    {/* Paystack */}
                    <div className="flex items-center space-x-3 p-4 border rounded-lg">
                      <RadioGroupItem value="paystack" id="paystack" />
                      <Label htmlFor="paystack" className="flex items-center gap-3 cursor-pointer flex-1">
                        <Wallet className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="font-medium">Paystack</div>
                          <div className="text-sm text-muted-foreground">
                            Cards, Bank Transfer, USSD • Nigeria & Global
                          </div>
                        </div>
                      </Label>
                    </div>

                    {/* Bank Transfer */}
                    <div className="flex items-center space-x-3 p-4 border rounded-lg">
                      <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                      <Label htmlFor="bank_transfer" className="flex items-center gap-3 cursor-pointer flex-1">
                        <Building className="h-5 w-5 text-purple-600" />
                        <div>
                          <div className="font-medium">Bank Transfer</div>
                          <div className="text-sm text-muted-foreground">
                            Direct transfer • Instructions via email
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>

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
                        <span>${totalCost.toFixed(2)}</span>
                      </div>
                      {selectedPaymentType === "full" && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount ({discountPercent}%):</span>
                          <span>-${fullPaymentDiscount.toFixed(2)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Amount to Pay:</span>
                        <span>${currentPaymentAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Button */}
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
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Pay ${currentPaymentAmount.toFixed(2)} with {selectedPaymentMethod.replace("_", " ").toUpperCase()}
                      </>
                    )}
                  </Button>

                  <div className="mt-4 text-center text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Shield className="h-4 w-4" />
                      <span>Your payment is secured with 256-bit SSL encryption</span>
                    </div>
                    <p>
                      By proceeding, you agree to our terms of service and privacy policy.
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