// components/admin/payment-approver.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
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
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertTriangle, DollarSign } from "lucide-react"

interface PaymentApproverProps {
  paymentId: string
  paymentStatus: string
  amount: number
  currency: string
  paymentMethod: string
  paymentType?: string
  paystackReference?: string
}

export function PaymentApprover({
  paymentId,
  paymentStatus,
  amount,
  currency,
  paymentMethod,
  paymentType,
  paystackReference
}: PaymentApproverProps) {
  const router = useRouter()
  const [isApproving, setIsApproving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Only allow approval of successful/completed payments that haven't been confirmed yet
  const approvableStatuses = ['success', 'completed']
  const canApprove = approvableStatuses.includes(paymentStatus)

  const handleApprove = async () => {
    setIsApproving(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentStatus,
          paystackReference
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to approve payment')
      }

      const result = await response.json()
      setSuccess(true)

      // Refresh the page to show updated data
      setTimeout(() => {
        router.refresh()
        setSuccess(false)
      }, 2000)

    } catch (err: any) {
      console.error('Error approving payment:', err)
      setError(err.message || 'Failed to approve payment')
    } finally {
      setIsApproving(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  if (!canApprove) {
    return (
      <div className="p-3 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          Payment status "{paymentStatus}" does not require approval.
          Only successful/completed payments can be approved.
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
            Payment has been approved and confirmed successfully.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">
                {currency === 'USDT' ? '$' : currency === 'NGN' ? '₦' : '$'}{amount.toLocaleString()}
              </span>
              <Badge className={getStatusColor(paymentStatus)}>
                {paymentStatus}
              </Badge>
              {paymentType && (
                <Badge variant="outline" className="text-xs">
                  {paymentType}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {paymentMethod} • {paymentId.slice(0, 8)}...
            </p>
            {paystackReference && (
              <p className="text-xs text-green-600 mt-1">
                Paystack Ref: {paystackReference}
              </p>
            )}
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="default"
                size="sm"
                disabled={isApproving}
                className="bg-green-600 hover:bg-green-700"
              >
                {isApproving ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-2"></div>
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </>
                )}
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Approve Successful Payment?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>
                    This will mark the payment as officially confirmed and approved.
                    The client will be notified and the service request status may be updated.
                  </p>
                  <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      <strong>Payment Details:</strong>
                    </p>
                    <ul className="text-sm text-green-700 dark:text-green-300 mt-1">
                      <li>• Amount: {currency === 'USDT' ? '$' : currency === 'NGN' ? '₦' : '$'}{amount.toLocaleString()}</li>
                      <li>• Status: {paymentStatus}</li>
                      <li>• Method: {paymentMethod}</li>
                      {paymentType && <li>• Type: {paymentType}</li>}
                      {paystackReference && <li>• Paystack Ref: {paystackReference}</li>}
                      <li>• ID: {paymentId}</li>
                    </ul>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={isApproving}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isApproving ? 'Approving...' : 'Approve Payment'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="text-xs text-muted-foreground bg-green-50 dark:bg-green-950/20 p-2 rounded">
          <strong>Note:</strong> Approving this payment will confirm it as valid and may trigger
          automatic notifications to the client. Only approve payments you have verified as legitimate.
        </div>
      </div>
    </div>
  )
}