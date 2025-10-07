"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, ExternalLink, Mail, DollarSign, CheckCircle, Clock, Calculator } from "lucide-react"

interface RemainingBalanceLinkGeneratorProps {
  requestId: string
  totalPaid: number
  balanceDue: number
  clientEmail?: string
  clientName?: string
  partialPaymentStatus: string
}

export function RemainingBalanceLinkGenerator({
  requestId,
  totalPaid,
  balanceDue,
  clientEmail,
  clientName,
  partialPaymentStatus
}: RemainingBalanceLinkGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [paymentLink, setPaymentLink] = useState("")
  const [linkExpiry, setLinkExpiry] = useState("")
  const [error, setError] = useState("")
  const [origin, setOrigin] = useState<string>("")

  // Set origin after hydration to prevent mismatch
  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const canGenerateLink = partialPaymentStatus === "first_paid" && balanceDue > 0

  const generateRemainingBalanceLink = async () => {
    if (!canGenerateLink) return

    setIsGenerating(true)
    setError("")

    try {
      // Add link expiry timestamp (1 hour from now)
      const expiryTime = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      const updateData = {
        payment_link_expiry: expiryTime.toISOString(),
        // Add a flag to indicate this is for remaining balance
        remaining_balance_link_active: true
      }

      const updateResponse = await fetch(`/api/service-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      if (!updateResponse.ok) {
        throw new Error("Failed to update service request")
      }

      // Generate the payment link
      const link = origin ? `${origin}/payment/${requestId}` : `/payment/${requestId}`
      setPaymentLink(link)
      setLinkExpiry(expiryTime.toISOString())

    } catch (error: any) {
      setError(error.message || "Failed to generate remaining balance link")
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
      alert("Remaining balance payment link sent to client email (demo)")
    } catch (error) {
    }
  }

  if (!canGenerateLink) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Remaining Balance Payment
        </CardTitle>
        <CardDescription>
          Generate a payment link specifically for the remaining balance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Balance Summary */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Paid</p>
            <p className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Remaining Balance</p>
            <p className="text-2xl font-bold text-orange-600">${balanceDue.toFixed(2)}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Payment Status:</span>
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            First Payment Completed
          </Badge>
        </div>

        {/* Client Info */}
        {clientEmail && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <p className="text-sm font-medium">Remaining balance link will be sent to:</p>
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
          onClick={generateRemainingBalanceLink}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? "Generating..." : "Generate Remaining Balance Payment Link"}
        </Button>

        {/* Generated Link */}
        {paymentLink && (
          <div className="space-y-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                Remaining Balance Payment Link Generated
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
                <strong>Payment Details for Client:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Amount Due: ${balanceDue.toFixed(2)} (remaining balance)</li>
                  <li>• Payment Type: Final payment (2 of 2)</li>
                  <li>• No split payment option (full remaining balance only)</li>
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