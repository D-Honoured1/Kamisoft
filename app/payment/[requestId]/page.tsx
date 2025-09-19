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
  Info
} from "lucide-react"
import { SERVICE_CATEGORIES } from "@/lib/constants/services"
import type { ServiceRequest } from "@/lib/types/database"

type PaymentMethod = "stripe" | "paystack" | "crypto" | "bank_transfer"

export default function PaymentPage() {
  const params = useParams()
  const requestId = params.requestId as string

  const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>("stripe")
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchServiceRequest()
  }, [requestId])

  const fetchServiceRequest = async () => {
    try {
      const response = await fetch(`/api/service-requests/${requestId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch service request")
      }
      const data = await response.json()
      setServiceRequest(data)
    } catch (error) {
      console.error("Error fetching service request:", error)
      setError("Failed to load payment information")
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
        // You might want to redirect to a success page or show instructions
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

  if (error && !serviceRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 py-12">
        <div className="container max-w-2xl">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Payment Error</h2>
              <p className="text-muted-foreground">{error || "Service request not found"}</p>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()} 
                className="mt-4"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const serviceCategory = SERVICE_CATEGORIES[serviceRequest?.service_category as keyof typeof SERVICE_CATEGORIES]
  const upfrontAmount = (serviceRequest?.estimated_cost || 0) * 0.5 // 50% upfront

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 py-12">
      <div className="container max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Complete Your Payment</h1>
          <p className="text-muted-foreground">Secure payment processing for your service request</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Order Summary
              </CardTitle>
              <CardDescription>Review your service request details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{serviceRequest?.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">{serviceCategory?.label}</Badge>
                    <Badge variant={serviceRequest?.request_type === "digital" ? "default" : "outline"}>
                      {serviceRequest?.request_type === "digital" ? "Digital" : "On-Site"}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {serviceRequest?.description}
                </p>

                {serviceRequest?.client && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Client:</span>
                      <span>{serviceRequest.client.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span>{serviceRequest.client.email}</span>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Project Total</span>
                  <span>${serviceRequest?.estimated_cost?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Upfront Payment (50%)</span>
                  <span>${upfrontAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Remaining (Upon Completion)</span>
                  <span>${((serviceRequest?.estimated_cost || 0) - upfrontAmount).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Amount Due Now</span>
                  <span>${upfrontAmount.toFixed(2)}</span>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Payment Terms:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• 50% upfront payment to begin work</li>
                    <li>• Remaining 50% upon project completion</li>
                    <li>• Full refund if cancelled within 24 hours</li>
                    <li>• All payments are secured with SSL encryption</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Payment Method
              </CardTitle>
              <CardDescription>Choose your preferred payment method</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                    Pay ${upfrontAmount.toFixed(2)}
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}