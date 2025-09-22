// app/payment/[requestId]/page.tsx - ENHANCED VERSION WITH PAYMENT TYPE SELECTION
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
  Lock,
  Percent,
  Tag,
  Calculator
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

  // Payment configuration
  const FULL_PAYMENT_DISCOUNT_PERCENT = 10 // 10% discount for full payment
  const SPLIT_PAYMENT_PERCENT = 50 // 50% upfront for split payment

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
      const cost = serviceRequest.estimated_cost || 0
      let paymentAmount: number
      let paymentMetadata: any = {
        payment_type: selectedPaymentType,
        original_amount: cost
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
        const discountAmount = cost * (FULL_PAYMENT_DISCOUNT_PERCENT / 100)
        paymentAmount = cost - discountAmount
        paymentMetadata = {
          ...paymentMetadata,
          discount_percent: FULL_PAYMENT_DISCOUNT_PERCENT,
          discount_amount: discountAmount,
          savings: discountAmount,
          description: `Full payment with ${FULL_PAYMENT_DISCOUNT_PERCENT}% discount`
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
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 py-12">
        <div className="container max-w-2xl">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-4 animate-spin" />
              <p>Loading payment information...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Access Denied Screen
  if (accessDenied || (error && !serviceRequest)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 py-12">
        <div className="container max-w-2xl">
          <Card className="border-0 shadow-lg border-red-200">
            <CardContent className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Lock className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2 text-red-800">Payment Access Restricted</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              
              <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-2 text-red-800 dark:text-red-200">Why am I seeing this?</h3>
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1 text-left">
                  <li>• Payment links are only active for approved requests</li>
                  <li>• The request must have an estimated cost set by admin</li>
                  <li>• Payment may already be completed</li>
                  <li>• The service request may not exist</li>
                </ul>
              </div>

              <div className="space-y-2">
                {isAdmin ? (
                  <Button asChild>
                    <a href={`/admin/requests/${requestId}`}>View Request in Admin</a>
                  </Button>
                ) : (
                  <Button asChild>
                    <a href="/contact">Contact Support</a>
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  className="ml-2"
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
  const fullPaymentDiscount = totalCost * (FULL_PAYMENT_DISCOUNT_PERCENT / 100)
  const fullPaymentAmount = totalCost - fullPaymentDiscount

  const currentPaymentAmount = selectedPaymentType === "split" ? splitAmount : fullPaymentAmount

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 py-12">
      <div className="container max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Complete Your Payment</h1>
          <p className="text-muted-foreground">Secure payment processing for your approved service request</p>
          {isAdmin && (
            <div className="mt-4">
              <Badge variant="secondary" className="flex items-center gap-2 w-fit mx-auto">
                <User className="h-3 w-3" />
                Admin Preview Mode
              </Badge>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Order Summary */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Approved Service Request
              </CardTitle>
              <CardDescription>Your request has been approved and is ready for payment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Project Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{serviceRequest?.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">{serviceCategory?.label}</Badge>
                    <Badge variant={serviceRequest?.request_type === "digital" ? "default" : "outline"}>
                      {serviceRequest?.request_type === "digital" ? "Digital" : "On-Site"}
                    </Badge>
                    <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                      Approved
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {serviceRequest?.description}
                </p>

                {serviceRequest?.clients && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Client:</span>
                      <span>{serviceRequest.clients.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span>{serviceRequest.clients.email}</span>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Payment Type Selection */}
              <div className="space-y-4">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Choose Payment Option
                </Label>
                <RadioGroup value={selectedPaymentType} onValueChange={(value) => setSelectedPaymentType(value as PaymentType)}>
                  {/* Split Payment */}
                  <Card className={`p-4 cursor-pointer transition-all hover:shadow-md border-2 ${
                    selectedPaymentType === "split" ? "border-primary bg-primary/5" : "border-border"
                  }`}>
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem value="split" id="split" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="split" className="text-base font-medium cursor-pointer">
                          Split Payment ({SPLIT_PAYMENT_PERCENT}/{100 - SPLIT_PAYMENT_PERCENT})
                        </Label>
                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                          <div>• Pay now: <span className="font-medium text-foreground">${splitAmount.toFixed(2)}</span></div>
                          <div>• On completion: <span className="font-medium text-foreground">${(totalCost - splitAmount).toFixed(2)}</span></div>
                          <div className="text-xs text-blue-600">Standard payment terms • Work begins immediately</div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Full Payment */}
                  <Card className={`p-4 cursor-pointer transition-all hover:shadow-md border-2 ${
                    selectedPaymentType === "full" ? "border-primary bg-primary/5" : "border-border"
                  }`}>
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem value="full" id="full" className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="full" className="text-base font-medium cursor-pointer">
                            Full Payment
                          </Label>
                          <Badge className="bg-green-100 text-green-800">
                            <Tag className="h-3 w-3 mr-1" />
                            {FULL_PAYMENT_DISCOUNT_PERCENT}% OFF
                          </Badge>
                        </div>
                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                          <div>• Original: <span className="line-through">${totalCost.toFixed(2)}</span></div>
                          <div>• Discount: <span className="text-green-600">-${fullPaymentDiscount.toFixed(2)} ({FULL_PAYMENT_DISCOUNT_PERCENT}%)</span></div>
                          <div>• Pay now: <span className="font-medium text-foreground text-base">${fullPaymentAmount.toFixed(2)}</span></div>
                          <div className="text-xs text-green-600">Save ${fullPaymentDiscount.toFixed(2)} • No additional payments required</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </RadioGroup>
              </div>

              <Separator />

              {/* Payment Summary */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Project Total</span>
                  <span>${totalCost.toFixed(2)}</span>
                </div>
                
                {selectedPaymentType === "full" && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Full Payment Discount ({FULL_PAYMENT_DISCOUNT_PERCENT}%)</span>
                    <span>-${fullPaymentDiscount.toFixed(2)}</span>
                  </div>
                )}
                
                {selectedPaymentType === "split" && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Remaining (Upon Completion)</span>
                    <span>${(totalCost - splitAmount).toFixed(2)}</span>
                  </div>
                )}
                
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Amount Due Now</span>
                  <span className="text-primary">${currentPaymentAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Terms Info */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Payment Terms:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    {selectedPaymentType === "split" ? (
                      <>
                        <li>• {SPLIT_PAYMENT_PERCENT}% upfront payment to begin work</li>
                        <li>• Remaining {100 - SPLIT_PAYMENT_PERCENT}% upon project completion</li>
                      </>
                    ) : (
                      <>
                        <li>• Full payment with {FULL_PAYMENT_DISCOUNT_PERCENT}% discount</li>
                        <li>• No additional payments required</li>
                        <li>• Save ${fullPaymentDiscount.toFixed(2)} compared to split payment</li>
                      </>
                    )}
                    <li>• Work begins within 24 hours of payment</li>
                    <li>• All payments are secured with SSL encryption</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Right Column: Payment Methods */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Payment Method
              </CardTitle>
              <CardDescription>Choose your preferred payment method</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Selection Summary */}
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Selected Payment Plan:</span>
                  <Badge variant="default">
                    {selectedPaymentType === "split" ? `${SPLIT_PAYMENT_PERCENT}/${100 - SPLIT_PAYMENT_PERCENT} Split` : `Full (-${FULL_PAYMENT_DISCOUNT_PERCENT}%)`}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-primary">
                  ${currentPaymentAmount.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedPaymentType === "split" 
                    ? `${SPLIT_PAYMENT_PERCENT}% of $${totalCost.toFixed(2)} total project cost`
                    : `Full payment with $${fullPaymentDiscount.toFixed(2)} savings`
                  }
                </div>
              </div>

              <RadioGroup
                value={selectedPaymentMethod}
                onValueChange={(value) => setSelectedPaymentMethod(value as PaymentMethod)}
                className="space-y-4"
              >
                {paymentMethods.map((method) => {
                  const Icon = method.icon
                  return (
                    <Card
                      key={method.id}
                      className={`p-4 cursor-pointer transition-all hover:shadow-md border-2 ${
                        selectedPaymentMethod === method.id ? "border-primary bg-primary/5" : "border-border"
                      } ${!method.available ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value={method.id} id={method.id} disabled={!method.available} />
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Label
                              htmlFor={method.id}
                              className={`text-base font-medium ${method.available ? "cursor-pointer" : "cursor-not-allowed"}`}
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
                          <p className="text-sm text-muted-foreground mt-1">{method.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Processing fee: {method.processingFee}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </RadioGroup>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handlePayment}
                disabled={isProcessing || !paymentMethods.find((m) => m.id === selectedPaymentMethod)?.available}
                size="lg"
                className="w-full"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Pay ${currentPaymentAmount.toFixed(2)}
                    <ExternalLink className="h-4 w-4" />
                  </div>
                )}
              </Button>

              <div className="text-center space-y-2 text-xs text-muted-foreground">
                <p className="flex items-center justify-center gap-1">
                  <Shield className="h-3 w-3" />
                  Your payment is secured with 256-bit SSL encryption
                </p>
                <p>By proceeding, you agree to our Terms of Service and Privacy Policy</p>
              </div>

              {isAdmin && (
                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full" asChild>
                    <a href={`/admin/requests/${requestId}`}>Back to Request Details</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}