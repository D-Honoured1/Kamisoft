// components/admin/crypto-payment-verifier.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Hash,
  DollarSign,
  Network,
  Clock,
  Copy
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface CryptoPaymentVerifierProps {
  paymentId: string
  paymentStatus: string
  amount: number
  currency: string
  cryptoAddress?: string
  cryptoNetwork?: string
  cryptoAmount?: number
  cryptoSymbol?: string
  cryptoTransactionHash?: string
  paymentMethod: string
  metadata?: string
}

export function CryptoPaymentVerifier({
  paymentId,
  paymentStatus,
  amount,
  currency,
  cryptoAddress,
  cryptoNetwork,
  cryptoAmount,
  cryptoSymbol,
  cryptoTransactionHash,
  paymentMethod,
  metadata
}: CryptoPaymentVerifierProps) {
  const router = useRouter()
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { toast } = useToast()

  // Only show for crypto payments that are processing
  const canVerify = paymentMethod === 'crypto' && paymentStatus === 'processing'

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

  const getExplorerUrl = (): string | null => {
    if (!cryptoTransactionHash || !cryptoNetwork) return null

    const explorers: Record<string, string> = {
      'TRC20': `https://tronscan.org/#/transaction/${cryptoTransactionHash}`,
      'ERC20': `https://etherscan.io/tx/${cryptoTransactionHash}`,
      'Ethereum': `https://etherscan.io/tx/${cryptoTransactionHash}`,
      'Bitcoin': `https://blockstream.info/tx/${cryptoTransactionHash}`
    }

    return explorers[cryptoNetwork] || null
  }

  const parseMetadata = (): any => {
    if (!metadata) return null
    try {
      return JSON.parse(metadata)
    } catch {
      return null
    }
  }

  const metadataObj = parseMetadata()
  const transactionDetails = metadataObj?.transaction_submitted
  const explorerUrl = getExplorerUrl()

  if (!canVerify) {
    return (
      <div className="p-3 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          {paymentMethod !== 'crypto'
            ? "Not a crypto payment"
            : paymentStatus !== 'processing'
            ? `NOWPayments status: ${paymentStatus}`
            : "NOWPayments processing - waiting for confirmation"
          }
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Crypto payment has been verified and approved successfully.
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Network className="h-5 w-5" />
            NOWPayments Crypto Verification
          </CardTitle>
          <CardDescription className="text-blue-700">
            Verify the NOWPayments cryptocurrency transaction
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Payment Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-blue-800">USD Amount</p>
              <p className="text-lg font-bold text-blue-900">
                ${amount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">Crypto Amount</p>
              <p className="text-lg font-bold text-blue-900">
                {cryptoAmount} {cryptoSymbol}
              </p>
            </div>
          </div>

          {/* Network Info */}
          <div className="flex items-center justify-between p-3 bg-blue-100 rounded-lg">
            <div>
              <p className="text-sm font-medium text-blue-800">Network</p>
              <Badge className="bg-blue-600 text-white">{cryptoNetwork}</Badge>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-blue-800">Symbol</p>
              <Badge variant="outline" className="border-blue-300 text-blue-700">
                {cryptoSymbol}
              </Badge>
            </div>
          </div>

          {/* Address */}
          <div>
            <p className="text-sm font-medium text-blue-800 mb-1">Payment Address</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-blue-100 rounded text-xs font-mono text-blue-900 break-all">
                {cryptoAddress}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(cryptoAddress || '', "Address")}
                className="border-blue-300"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Transaction Hash */}
          <div>
            <p className="text-sm font-medium text-blue-800 mb-1">Transaction Hash</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-blue-100 rounded text-xs font-mono text-blue-900 break-all">
                {cryptoTransactionHash}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(cryptoTransactionHash || '', "Transaction hash")}
                className="border-blue-300"
              >
                <Copy className="h-4 w-4" />
              </Button>
              {explorerUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="border-blue-300"
                >
                  <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Transaction Details */}
          {transactionDetails && (
            <div className="p-3 bg-blue-100 rounded-lg">
              <p className="text-sm font-medium text-blue-800 mb-2">Submission Details</p>
              <div className="space-y-1 text-xs text-blue-700">
                <div className="flex justify-between">
                  <span>Submitted:</span>
                  <span>{new Date(transactionDetails.submitted_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Network:</span>
                  <span>{transactionDetails.network_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Expected Confirmations:</span>
                  <span>{transactionDetails.estimated_confirmations}</span>
                </div>
                {transactionDetails.customer_note && (
                  <div className="mt-2">
                    <span className="font-medium">Customer Note:</span>
                    <p className="text-blue-600 italic">{transactionDetails.customer_note}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Verification Actions */}
          <div className="flex gap-2 pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  disabled={isVerifying}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Verify & Approve
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Verify Crypto Payment?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>
                      This will mark the crypto payment as verified and confirmed.
                      Please ensure you have verified the transaction on the blockchain explorer.
                    </p>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Payment Details:</strong>
                      </p>
                      <ul className="text-sm text-green-700 mt-1">
                        <li>• Amount: {cryptoAmount} {cryptoSymbol} (${amount})</li>
                        <li>• Network: {cryptoNetwork}</li>
                        <li>• Transaction: {cryptoTransactionHash?.substring(0, 20)}...</li>
                      </ul>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isVerifying}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      setIsVerifying(true)
                      try {
                        const response = await fetch(`/api/admin/payments/${paymentId}/approve`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            paymentStatus: 'processing'
                          })
                        })

                        if (!response.ok) {
                          throw new Error('Failed to approve payment')
                        }

                        setSuccess(true)
                        router.refresh()
                        toast({
                          title: "Success",
                          description: "Crypto payment verified and approved",
                        })
                      } catch (err: any) {
                        setError(err.message)
                      } finally {
                        setIsVerifying(false)
                      }
                    }}
                    disabled={isVerifying}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isVerifying ? 'Verifying...' : 'Verify Payment'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {explorerUrl && (
              <Button
                variant="outline"
                asChild
                className="border-blue-300"
              >
                <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View on Explorer
                </a>
              </Button>
            )}
          </div>

          <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
            <strong>NOWPayments Integration:</strong>
            <ol className="mt-1 space-y-1">
              <li>1. NOWPayments automatically detects blockchain transactions</li>
              <li>2. Payment status is updated via webhook notifications</li>
              <li>3. Manual verification available for edge cases</li>
              <li>4. Click "Verify & Approve" to manually confirm if needed</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}