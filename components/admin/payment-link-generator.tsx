// components/admin/payment-link-generator.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Copy, ExternalLink, Mail, DollarSign, CheckCircle } from "lucide-react"

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
  const [isGenerating, setIsGenerating] = useState(false)
  const [paymentLink, setPaymentLink] = useState("")
  const [error, setError] = useState("")

  const canGeneratePayment = status === "approved" && estimatedCost && parseFloat(estimatedCost) > 0

  const generatePaymentLink = async () => {
    if (!canGeneratePayment) return

    setIsGenerating(true)
    setError("")

    try {
      // First update the service request with the estimated cost
      const updateResponse = await fetch(`/api/service-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estimated_cost: parseFloat(estimatedCost),
          status: "approved" // Ensure it's approved
        }),
      })

      if (!updateResponse.ok) {
        throw new Error("Failed to update estimated cost")
      }

      // Generate the payment link
      const link = `${window.location.origin}/payment/${requestId}`
      setPaymentLink(link)

      // Optionally send email notification to client
      // await sendPaymentLinkEmail(requestId, link)

    } catch (error: any) {
      setError(error.message || "Failed to generate payment link")
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(paymentLink)
    // You could add a toast notification here
  }

  const sendEmailNotification = async () => {
    try {
      // This would integrate with your email service
      console.log("Sending payment link email to:", clientEmail)
      // await fetch('/api/notifications/payment-link', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ requestId, paymentLink, clientEmail })
      // })
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
          Generate secure payment link for approved service requests
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Check */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Request Status:</span>
          <Badge className={
            status === "approved" 
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
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
          <Label htmlFor="estimated_cost">Estimated Cost (USD) *</Label>
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
          <p className="text-xs text-muted-foreground">
            Client will pay 50% upfront (${((parseFloat(estimatedCost) || 0) * 0.5).toFixed(2)})
          </p>
        </div>

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