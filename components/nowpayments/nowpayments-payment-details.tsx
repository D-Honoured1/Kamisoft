// components/nowpayments/nowpayments-payment-details.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Copy,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Hash,
  Network
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"

interface NOWPaymentsPaymentDetailsProps {
  paymentId: string
  payCurrency: string
  usdAmount: number
  paymentReference: string
  onTransactionSubmitted?: () => void
}

interface NOWPaymentsDetails {
  networkId: string
  network: {
    id: string
    name: string
    symbol: string
    network: string
    estimatedConfirmations: number
    averageFeeUsd: number
  }
  address: string
  amount: number
  amountCrypto: number
  usdAmount: number
  exchangeRate: number
  qrCodeUrl: string
  expiresAt: string
  instructions: string[]
  fees: {
    networkFeeUsd: number
    estimatedTotal: number
  }
}

export function NOWPaymentsPaymentDetails({
  paymentId,
  payCurrency,
  usdAmount,
  paymentReference,
  onTransactionSubmitted
}: NOWPaymentsPaymentDetailsProps) {
  const [nowpaymentsDetails, setNowpaymentsDetails] = useState<NOWPaymentsDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transactionHash, setTransactionHash] = useState("")
  const [customerNote, setCustomerNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    generateNOWPaymentsDetails()
  }, [paymentId, payCurrency, usdAmount, paymentReference])

  const generateNOWPaymentsDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/nowpayments/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId,
          payCurrency,
          usdAmount,
          paymentReference
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate NOWPayments payment details')
      }

      const data = await response.json()
      setNowpaymentsDetails(data.nowpaymentsDetails)
    } catch (err: any) {
      console.error('Error generating NOWPayments details:', err)
      setError(err.message || 'Failed to generate NOWPayments payment details')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      })
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy manually",
        variant: "destructive"
      })
    }
  }

  const submitTransaction = async () => {
    if (!transactionHash.trim()) {
      toast({
        title: "Error",
        description: "Please enter the transaction hash",
        variant: "destructive"
      })
      return
    }

    try {
      setSubmitting(true)

      const response = await fetch('/api/nowpayments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId,
          transactionHash: transactionHash.trim(),
          payCurrency,
          customerNote: customerNote.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit transaction')
      }

      await response.json()
      setSubmitted(true)

      toast({
        title: "Transaction Submitted!",
        description: "Your payment will be verified within 1-2 hours",
      })

      onTransactionSubmitted?.()

    } catch (err: any) {
      console.error('Error submitting transaction:', err)
      toast({
        title: "Submission Failed",
        description: err.message || 'Failed to submit transaction hash',
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Generating NOWPayments payment details...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button
            variant="outline"
            size="sm"
            className="ml-2"
            onClick={generateNOWPaymentsDetails}
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!nowpaymentsDetails) {
    return (
      <Alert>
        <AlertDescription>
          No crypto payment details available.
        </AlertDescription>
      </Alert>
    )
  }

  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <CardTitle className="text-green-600">Transaction Submitted</CardTitle>
          </div>
          <CardDescription>
            Your transaction hash has been submitted for verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Next Steps:</strong>
            </p>
            <ul className="text-sm text-green-700 mt-2 space-y-1">
              <li>• Your payment will be verified within 1-2 hours</li>
              <li>• You'll receive an email confirmation once verified</li>
              <li>• You can check your payment status in your account</li>
            </ul>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium">Transaction Hash</p>
              <p className="text-xs text-muted-foreground font-mono">
                {transactionHash.substring(0, 20)}...
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(transactionHash, "Transaction hash")}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const timeLeft = new Date(nowpaymentsDetails.expiresAt).getTime() - Date.now()
  const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)))

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            {nowpaymentsDetails.network.name} Payment
          </CardTitle>
          <CardDescription>
            Send exactly {nowpaymentsDetails.amountCrypto} {nowpaymentsDetails.network.symbol} to complete your payment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">USD Amount</Label>
              <p className="font-semibold">${nowpaymentsDetails.usdAmount.toFixed(2)}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Crypto Amount</Label>
              <p className="font-semibold">
                {nowpaymentsDetails.amountCrypto} {nowpaymentsDetails.network.symbol}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Network Fee</Label>
              <p className="text-sm">~${nowpaymentsDetails.fees.networkFeeUsd}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Expires In</Label>
              <p className="text-sm flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {hoursLeft}h
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Address & QR Code */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Address</CardTitle>
          <CardDescription>
            Send {nowpaymentsDetails.network.symbol} to this address only
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-lg border">
              <Image
                src={nowpaymentsDetails.qrCodeUrl}
                alt="Payment QR Code"
                width={200}
                height={200}
                className="rounded"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <Label className="text-sm font-medium">
              {nowpaymentsDetails.network.network} Address
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                value={nowpaymentsDetails.address}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(nowpaymentsDetails.address, "Address")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Amount to Send */}
          <div>
            <Label className="text-sm font-medium">Exact Amount to Send</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                value={`${nowpaymentsDetails.amountCrypto} ${nowpaymentsDetails.network.symbol}`}
                readOnly
                className="font-mono text-sm font-bold"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(nowpaymentsDetails.amountCrypto.toString(), "Amount")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {nowpaymentsDetails.instructions.map((instruction, index) => (
              <div key={index} className="flex items-start gap-2">
                <Badge variant="outline" className="text-xs mt-0.5">
                  {index + 1}
                </Badge>
                <p className="text-sm">{instruction}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transaction Hash Submission */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Submit Transaction Hash</CardTitle>
          <CardDescription>
            After sending the payment, submit your transaction hash to verify the payment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="transactionHash">
              Transaction Hash <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <Input
                id="transactionHash"
                placeholder="Enter your transaction hash"
                value={transactionHash}
                onChange={(e) => setTransactionHash(e.target.value)}
                className="font-mono"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              You can find this in your wallet after sending the transaction
            </p>
          </div>

          <div>
            <Label htmlFor="customerNote">
              Additional Notes <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Textarea
              id="customerNote"
              placeholder="Any additional information about your payment..."
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          <Button
            onClick={submitTransaction}
            disabled={!transactionHash.trim() || submitting}
            className="w-full"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Submit Transaction Hash
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Warning */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Only send {nowpaymentsDetails.network.symbol} on the{" "}
          {nowpaymentsDetails.network.network} network to this address. Sending other cryptocurrencies
          or using the wrong network will result in permanent loss of funds.
        </AlertDescription>
      </Alert>
    </div>
  )
}