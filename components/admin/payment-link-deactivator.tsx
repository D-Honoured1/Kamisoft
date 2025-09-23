// components/admin/payment-link-deactivator.tsx
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
import { XCircle, Clock, CheckCircle, AlertTriangle } from "lucide-react"

interface PaymentLinkDeactivatorProps {
  requestId: string
  currentStatus: string
  paymentLinkExpiry: string | null
  onDeactivated: () => void
}

export function PaymentLinkDeactivator({ 
  requestId, 
  currentStatus, 
  paymentLinkExpiry,
  onDeactivated 
}: PaymentLinkDeactivatorProps) {
  const [isDeactivating, setIsDeactivating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Check if link is already expired
  const isExpired = paymentLinkExpiry && new Date() > new Date(paymentLinkExpiry)
  const isActive = paymentLinkExpiry && !isExpired

  const handleDeactivate = async () => {
    setIsDeactivating(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/payment-links/${requestId}/deactivate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'deactivate',
          reason: 'manually_deactivated'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to deactivate payment link')
      }

      const result = await response.json()
      setSuccess(true)
      
      // Call parent callback to refresh data
      setTimeout(() => {
        onDeactivated()
        setSuccess(false)
      }, 2000)

    } catch (err: any) {
      console.error('Error deactivating payment link:', err)
      setError(err.message || 'Failed to deactivate payment link')
    } finally {
      setIsDeactivating(false)
    }
  }

  const getLinkStatus = () => {
    if (!paymentLinkExpiry) {
      return { status: 'No Link', color: 'bg-gray-100 text-gray-800', icon: <XCircle className="h-3 w-3" /> }
    }
    
    if (isExpired) {
      return { status: 'Expired', color: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3" /> }
    }
    
    return { status: 'Active', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3" /> }
  }

  const linkStatus = getLinkStatus()

  // Don't show deactivation button if no active link
  if (!isActive) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Payment Link Status:</span>
          <Badge className={linkStatus.color}>
            <span className="flex items-center gap-1">
              {linkStatus.icon}
              {linkStatus.status}
            </span>
          </Badge>
        </div>
        
        {paymentLinkExpiry && (
          <p className="text-xs text-muted-foreground">
            {isExpired 
              ? `Expired: ${new Date(paymentLinkExpiry).toLocaleString()}`
              : `No active payment link`
            }
          </p>
        )}
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
            Payment link has been deactivated successfully.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Payment Link Status:</span>
          <Badge className={linkStatus.color}>
            <span className="flex items-center gap-1">
              {linkStatus.icon}
              {linkStatus.status}
            </span>
          </Badge>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>Created: {new Date(paymentLinkExpiry).toLocaleString()}</p>
          <p>Auto-expires: {new Date(new Date(paymentLinkExpiry).getTime() + 60 * 60 * 1000).toLocaleString()}</p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive" 
              size="sm"
              disabled={isDeactivating}
              className="w-full"
            >
              {isDeactivating ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-2"></div>
                  Deactivating...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Deactivate Payment Link
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deactivate Payment Link?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  This will immediately deactivate the payment link for this service request. 
                  The client will no longer be able to access the payment page.
                </p>
                <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Note:</strong> This action cannot be undone. You'll need to generate 
                    a new payment link if the client needs to make a payment later.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeactivating}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeactivate}
                disabled={isDeactivating}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeactivating ? 'Deactivating...' : 'Deactivate Link'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          <strong>Security Info:</strong> Payment links automatically expire after 1 hour for security. 
          Manual deactivation is useful when you need to cancel a payment immediately.
        </div>
      </div>
    </div>
  )
}