// components/admin/payment-link-generator.tsx - TASK 1: REMOVED RADIO BUTTONS
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Copy, ExternalLink, Mail, DollarSign, CheckCircle, Percent, Clock } from "lucide-react"

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
  const [fullPaymentDiscount, setFullPaymentDiscount] = useState("10") // Admin sets this discount
  const [isGenerating, setIsGenerating] = useState(false)
  const [paymentLink, setPaymentLink] = useState("")
  const [linkExpiry, setLinkExpiry] = useState("")
  const [error, setError] = useState("")
  const [origin, setOrigin] = useState<string>("")

  // Set origin after hydration to prevent mismatch
  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

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
      // Update estimated_cost and discount in the database
      const updateData: any = {}
      
      if (cost !== currentCost) {
        updateData.estimated_cost = cost
      }
      
      // Store the admin's discount setting (we'll need to add this field to the database)
      updateData.admin_discount_percent = discountPercent
      
      // Add link expiry timestamp (1 hour from now)
      const expiryTime = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      updateData.payment_link_expiry = expiryTime.toISOString()
      
      if (Object.keys(updateData).length > 0) {
        const updateResponse = await fetch(`/api/service-requests/${requestId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        })

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json()
          throw new Error("Failed to update service request")
        }
        
      }

      // Generate the payment link (simple URL without sensitive data)
      const link = origin ? `${origin}/payment/${requestId}` : `/payment/${requestId}`
      setPaymentLink(link)
      setLinkExpiry(expiryTime.toISOString())

    } catch (error: any) {
      setError(error.message || "Failed to generate payment link")
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(paymentLink)
    }
  }

  const sendEmailNotification = async () => {
    try {
      alert("Payment link sent to client email (demo)")
    } catch (error) {
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
          Generate secure payment link - client will choose between split or full payment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Check */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Request Status:</span>
          <Badge className={
            status === "approved" 
              ? "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
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
          {cost !== currentCost && cost > 0 && (
            <p className="text-xs text-amber-600">
              This will update the estimated cost from ${currentCost?.toFixed(2) || '0.00'} to ${cost.toFixed(2)}
            </p>
          )}
        </div>

        {/* Discount Setting - REMOVED RADIO BUTTONS, JUST INPUT */}
        <div className="space-y-2">
          <Label htmlFor="discount">Full Payment Discount (%)</Label>
          <div className="flex items-center gap-2">
            <Input
              id="discount"
              type="number"
              min="0"
              max="50"
              step="0.5"
              value={fullPaymentDiscount}
              onChange={(e) => setFullPaymentDiscount(e.target.value)}
              className="w-24"
              disabled={isGenerating}
            />
            <Percent className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              discount for full payment option
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Client will see both split and full payment options with this discount applied to full payment
          </p>
        </div>

        {/* Payment Preview - SIMPLIFIED WITHOUT RADIO BUTTONS */}
        {cost > 0 && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <Label>Payment Options Preview (Client will see both)</Label>
            
            <div className="space-y-3">
              {/* Split Payment Preview */}
              <div className="p-3 border rounded-lg bg-background">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Split Payment (50/50)</span>
                  <span className="text-blue-600 text-sm">Standard Option</span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>• Upfront: <span className="font-medium text-foreground">${splitPaymentAmount.toFixed(2)}</span></div>
                  <div>• On Completion: <span className="font-medium text-foreground">${(cost - splitPaymentAmount).toFixed(2)}</span></div>
                </div>
              </div>

              {/* Full Payment Preview */}
              <div className="p-3 border rounded-lg bg-background">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Full Payment</span>
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    {discountPercent}% OFF
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>• Original: <span className="line-through">${cost.toFixed(2)}</span></div>
                  <div>• Discount: <span className="text-green-600">-${discountAmount.toFixed(2)}</span></div>
                  <div>• Final Amount: <span className="font-medium text-foreground text-base">${fullPaymentAmount.toFixed(2)}</span></div>
                  <div className="text-xs text-green-600">Save ${discountAmount.toFixed(2)}!</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Client Info */}
        {clientEmail && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <p className="text-sm font-medium">Payment link will be sent to:</p>
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
                Payment Link Generated Successfully
              </span>
            </div>

            {/* Link Expiry Notice */}
            <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
              <Clock className="h-4 w-4" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <strong>Link expires:</strong> {linkExpiry} (1 hour from generation)
              </AlertDescription>
            </Alert>
            
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

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Payment Options Available for Client:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Split Payment: ${splitPaymentAmount.toFixed(2)} now, ${(cost - splitPaymentAmount).toFixed(2)} on completion</li>
                  <li>• Full Payment: ${fullPaymentAmount.toFixed(2)} (saves ${discountAmount.toFixed(2)} with {discountPercent}% discount)</li>
                  <li>• Client chooses their preferred option on the secure payment page</li>
                  <li>• Link expires in 1 hour for security</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  )
}