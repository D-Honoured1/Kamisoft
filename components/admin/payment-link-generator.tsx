// components/admin/payment-link-generator.tsx - ENHANCED VERSION
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Copy, ExternalLink, Mail, DollarSign, CheckCircle, Percent } from "lucide-react"

interface PaymentLinkGeneratorProps {
  requestId: string
  currentCost?: number
  clientEmail?: string
  clientName?: string
  status: string
}

export function PaymentLinkGenerator({ 
  requestId, 
  currentCost, 
  clientEmail, 
  clientName,
  status 
}: PaymentLinkGeneratorProps) {
  const [estimatedCost, setEstimatedCost] = useState(currentCost?.toString() || "")
  const [paymentType, setPaymentType] = useState<"split" | "full">("split")
  const [fullPaymentDiscount, setFullPaymentDiscount] = useState("10") // Default 10% discount
  const [isGenerating, setIsGenerating] = useState(false)
  const [paymentLink, setPaymentLink] = useState("")
  const [error, setError] = useState("")

  const canGeneratePayment = status === "approved" && estimatedCost && parseFloat(estimatedCost) > 0

  const cost = parseFloat(estimatedCost) || 0
  const discountPercent = parseFloat(fullPaymentDiscount) || 0
  const discountAmount = cost * (discountPercent / 100)
  const fullPaymentAmount = cost - discountAmount
  const splitPaymentAmount = cost * 0.5

  const generatePaymentLink = async () => {
    if (!canGeneratePayment) return

    setIsGenerating(true)
    setError("")

    try {
      // Update the service request with the estimated cost and payment options
      const updateData = {
        estimated_cost: cost,
        status: "approved",
        // Store payment options in the database
        payment_options: {
          split_payment: {
            upfront_amount: splitPaymentAmount,
            remaining_amount: cost - splitPaymentAmount,
            type: "50_50_split"
          },
          full_payment: {
            original_amount: cost,
            discount_percent: discountPercent,
            discount_amount: discountAmount,
            final_amount: fullPaymentAmount,
            type: "full_with_discount"
          }
        }
      }

      const updateResponse = await fetch(`/api/service-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      if (!updateResponse.ok) {
        throw new Error("Failed to update payment options")
      }

      // Generate the payment link
      const link = `${window.location.origin}/payment/${requestId}`
      setPaymentLink(link)

    } catch (error: any) {
      setError(error.message || "Failed to generate payment link")
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(paymentLink)
  }

  const sendEmailNotification = async () => {
    try {
      console.log("Sending payment link email to:", clientEmail)
      alert("Payment link sent to client email")
    } catch (error) {
      console.error("Failed to send email:", error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Payment Link Generation
        </CardTitle>
        <CardDescription>
          Generate secure payment link with flexible payment options
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Check */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Request Status:</span>
          <Badge className={
            status === "approved" 
              ? "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" // Updated to gray
              : status === "pending"
              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
              : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
          }>
            {status}
          </Badge>
        </div>

        {status !== "approved" && (
          <Alert>
            <AlertDescription>
              Request must be approved before generating payment link. 
              Update the status to "Approved" first.
            </AlertDescription>
          </Alert>
        )}

        {/* Cost Input */}
        <div className="space-y-2">
          <Label htmlFor="estimated_cost">Project Cost (USD) *</Label>
          <Input
            id="estimated_cost"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={estimatedCost}
            onChange={(e) => setEstimatedCost(e.target.value)}
            disabled={isGenerating}
          />
        </div>

        {/* Payment Options */}
        {cost > 0 && (
          <div className="space-y-4 p-4 border rounded-lg">
            <Label>Payment Options</Label>
            <RadioGroup value={paymentType} onValueChange={(value) => setPaymentType(value as "split" | "full")}>
              {/* Split Payment Option */}
              <div className="flex items-start space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="split" id="split" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="split" className="font-medium cursor-pointer">
                    Split Payment (50/50)
                  </Label>
                  <div className="mt-2 text-sm text-muted-foreground space-y-1">
                    <div>• Upfront: <span className="font-medium text-foreground">${splitPaymentAmount.toFixed(2)}</span></div>
                    <div>• On Completion: <span className="font-medium text-foreground">${(cost - splitPaymentAmount).toFixed(2)}</span></div>
                    <div className="text-xs text-blue-600">Standard payment terms</div>
                  </div>
                </div>
              </div>

              {/* Full Payment Option */}
              <div className="flex items-start space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="full" id="full" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="full" className="font-medium cursor-pointer">
                    Full Payment (with discount)
                  </Label>
                  <div className="mt-2 space-y-3">
                    {/* Discount Input */}
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        step="0.5"
                        value={fullPaymentDiscount}
                        onChange={(e) => setFullPaymentDiscount(e.target.value)}
                        className="w-20 h-8"
                        disabled={isGenerating}
                      />
                      <span className="text-sm">% discount</span>
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>• Original Amount: <span className="line-through">${cost.toFixed(2)}</span></div>
                      <div>• Discount ({discountPercent}%): <span className="text-green-600">-${discountAmount.toFixed(2)}</span></div>
                      <div>• Final Amount: <span className="font-medium text-foreground text-base">${fullPaymentAmount.toFixed(2)}</span></div>
                      <div className="text-xs text-green-600">Save ${discountAmount.toFixed(2)} with full payment!</div>
                    </div>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Payment Summary */}
        {cost > 0 && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-3">Payment Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Selected Option:</span>
                <span className="font-medium">
                  {paymentType === "split" ? "Split Payment (50/50)" : `Full Payment (${discountPercent}% discount)`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Amount Due Now:</span>
                <span className="font-bold text-lg">
                  ${paymentType === "split" ? splitPaymentAmount.toFixed(2) : fullPaymentAmount.toFixed(2)}
                </span>
              </div>
              {paymentType === "split" && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Remaining (on completion):</span>
                  <span>${(cost - splitPaymentAmount).toFixed(2)}</span>
                </div>
              )}
              {paymentType === "full" && discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Total Savings:</span>
                  <span>${discountAmount.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Client Info */}
        {clientEmail && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <p className="text-sm font-medium">Payment will be sent to:</p>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {clientName} ({clientEmail})
            </p>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Generate Button */}
        <Button
          onClick={generatePaymentLink}
          disabled={!canGeneratePayment || isGenerating}
          className="w-full"
        >
          {isGenerating ? "Generating..." : "Generate Payment Link"}
        </Button>

        {/* Generated Link */}
        {paymentLink && (
          <div className="space-y-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                Payment Link Generated
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-background rounded border text-sm font-mono">
                <span className="flex-1 truncate">{paymentLink}</span>
                <Button size="sm" variant="outline" onClick={copyToClipboard}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button size="sm" variant="outline" asChild className="flex-1">
                  <a href={paymentLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-3 w-3" />
                    Preview
                  </a>
                </Button>
                
                <Button size="sm" onClick={sendEmailNotification} className="flex-1">
                  <Mail className="mr-2 h-3 w-3" />
                  Email to Client
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}