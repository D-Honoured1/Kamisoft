"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CreditCard, Wallet, Bitcoin, Building, CheckCircle, Clock, AlertCircle } from "lucide-react"
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

      if (!response.ok) {
        throw new Error("Failed to create payment")
      }

      const { checkoutUrl, paymentId } = await response.json()

      if (checkoutUrl) {
        // Redirect to payment provider
        window.location.href = checkoutUrl
      } else {
        // Handle bank transfer or crypto payment
        alert("Payment instructions will be sent to your email")
      }
    } catch (error) {
      console.error("Error processing payment:", error)
      setError("Failed to process payment. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const paymentMethods = [
    {
      id: "stripe" as PaymentMethod,
      name: "Credit/Debit Card",
      description: "Pay securely with your credit or debit card",
      icon: CreditCard,
      available: true,
    },
    {
      id: "paystack" as PaymentMethod,
      name: "Paystack",
      description: "Pay with Paystack (Nigerian cards, bank transfer, USSD)",
      icon: Wallet,
      available: true,
    },
    {
      id: "crypto" as PaymentMethod,
      name: "Cryptocurrency",
      description: "Pay with Bitcoin, Ethereum, or other cryptocurrencies",
      icon: Bitcoin,
      available: false, // TODO: Implement crypto payments
    },
    {
      id: "bank_transfer" as PaymentMethod,
      name: "Bank Transfer",
      description: "Direct bank transfer (manual verification required)",
      icon: Building,
      available: true,
    },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 py-12">
        <div className="container max-w-2xl">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
              <p>Loading payment information...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !serviceRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 py-12">
        <div className="container max-w-2xl">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Payment Error</h2>
              <p className="text-muted-foreground">{error || "Service request not found"}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const serviceCategory = SERVICE_CATEGORIES[serviceRequest.service_category as keyof typeof SERVICE_CATEGORIES]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 py-12">
      <div className="container max-w-4xl">
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
                  <h3 className="font-semibold text-lg">{serviceRequest.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">{serviceCategory?.label}</Badge>
                    <Badge variant={serviceRequest.request_type === "digital" ? "default" : "outline"}>
                      {serviceRequest.request_type === "digital" ? "Digital" : "On-Site"}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">{serviceRequest.description}</p>

                {serviceRequest.client && (
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
                  <span>Service Fee</span>
                  <span>${serviceRequest.estimated_cost?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Processing Fee</span>
                  <span>$0.00</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${serviceRequest.estimated_cost?.toFixed(2) || "0.00"}</span>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-sm">
                <p className="font-medium mb-2">Payment Terms:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• 50% upfront payment to begin work</li>
                  <li>• Remaining 50% upon project completion</li>
                  <li>• Full refund if project is cancelled within 24 hours</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
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
                          <Label
                            htmlFor={method.id}
                            className={`text-base font-medium ${method.available ? "cursor-pointer" : "cursor-not-allowed"}`}
                          >
                            {method.name}
                            {!method.available && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Coming Soon
                              </Badge>
                            )}
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">{method.description}</p>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </RadioGroup>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                </div>
              )}

              <Button
                onClick={handlePayment}
                disabled={isProcessing || !paymentMethods.find((m) => m.id === selectedPaymentMethod)?.available}
                size="lg"
                className="w-full"
              >
                {isProcessing ? "Processing..." : `Pay $${serviceRequest.estimated_cost?.toFixed(2) || "0.00"}`}
              </Button>

              <div className="text-center text-xs text-muted-foreground">
                <p>Your payment is secured with 256-bit SSL encryption</p>
                <p className="mt-1">By proceeding, you agree to our Terms of Service</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
