// components/admin/payment-deleter.tsx
"use client"

import { useState } from "react"
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
import { Trash2, AlertTriangle, CheckCircle } from "lucide-react"

interface PaymentDeleterProps {
  paymentId: string
  paymentStatus: string
  amount: number
  currency: string
  paymentMethod: string
  onDeleted: () => void
}

export function PaymentDeleter({
  paymentId,
  paymentStatus,
  amount,
  currency,
  paymentMethod,
  onDeleted
}: PaymentDeleterProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Only allow deletion of failed, cancelled, or pending payments
  const deletableStatuses = ['failed', 'cancelled', 'pending']
  const canDelete = deletableStatuses.includes(paymentStatus)

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/payments/${paymentId}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete payment')
      }

      const result = await response.json()
      setSuccess(true)

      // Call parent callback to refresh data
      setTimeout(() => {
        onDeleted()
        setSuccess(false)
      }, 2000)

    } catch (err: any) {
      console.error('Error deleting payment:', err)
      setError(err.message || 'Failed to delete payment')
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "cancelled":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    }
  }

  if (!canDelete) {
    return (
      <div className="p-3 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          Cannot delete payment with status "{paymentStatus}".
          Only failed, cancelled, or pending payments can be deleted.
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
            Payment has been deleted successfully.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium">
                {currency === 'USDT' ? '$' : currency === 'NGN' ? '₦' : '$'}{amount.toLocaleString()}
              </span>
              <Badge className={getStatusColor(paymentStatus)}>
                {paymentStatus}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {paymentMethod} • {paymentId.slice(0, 8)}...
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </>
                )}
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Failed Payment?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>
                    This will permanently delete this payment record. This action cannot be undone.
                  </p>
                  <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <strong>Payment Details:</strong>
                    </p>
                    <ul className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      <li>• Amount: {currency === 'USDT' ? '$' : currency === 'NGN' ? '₦' : '$'}{amount.toLocaleString()}</li>
                      <li>• Status: {paymentStatus}</li>
                      <li>• Method: {paymentMethod}</li>
                      <li>• ID: {paymentId}</li>
                    </ul>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Payment'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          <strong>Note:</strong> Deleting this payment will remove it from the system.
          This should only be done for payments that failed or were cancelled and are no longer needed.
        </div>
      </div>
    </div>
  )
}