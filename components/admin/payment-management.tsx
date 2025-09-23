// components/admin/payment-management.tsx - Enhanced Payment Management Component
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Eye,
  FileText,
  CreditCard,
  Building,
  Wallet
} from "lucide-react"

interface Payment {
  id: string
  amount: number
  currency: string
  payment_method: string
  payment_status: string
  payment_type?: string
  stripe_payment_intent_id?: string
  paystack_reference?: string
  created_at: string
  updated_at: string
  error_message?: string
  admin_notes?: string
  confirmed_by?: string
  confirmed_at?: string
}

interface PaymentManagementProps {
  requestId: string
  estimatedCost?: number
}

export function PaymentManagement({ requestId, estimatedCost }: PaymentManagementProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    fetchPayments()
    
    // Set up real-time updates (you could use WebSocket or polling)
    const interval = setInterval(fetchPayments, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [requestId])

  const fetchPayments = async () => {
    try {
      const response = await fetch(`/api/admin/payments?request_id=${requestId}`)
      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments || [])
      }
    } catch (error) {
      console.error("Error fetching payments:", error)
    } finally {
      setLoading(false)
    }
  }

  const updatePaymentStatus = async (paymentId: string, status: string, notes?: string) => {
    setProcessingPayment(paymentId)
    
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          payment_status: status,
          admin_notes: notes,
          confirmed_at: new Date().toISOString()
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update payment status")
      }

      // Refresh payments
      await fetchPayments()
      setAdminNotes({ ...adminNotes, [paymentId]: "" })
    } catch (error) {
      console.error("Error updating payment:", error)
      alert("Failed to update payment status")
    } finally {
      setProcessingPayment(null)
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "stripe": return <CreditCard className="h-4 w-4" />
      case "paystack": return <Wallet className="h-4 w-4" />
      case "bank_transfer": return <Building className="h-4 w-4" />
      default: return <DollarSign className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
      case "confirmed": 
        return <CheckCircle className="h-4 w-4" />
      case "pending": 
        return <Clock className="h-4 w-4" />
      case "failed":
      case "declined": 
        return <XCircle className="h-4 w-4" />
      case "processing": 
        return <AlertTriangle className="h-4 w-4" />
      default: 
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
      case "confirmed": 
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pending": 
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "processing": 
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "failed":
      case "declined": 
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default: 
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const totalPaid = payments
    .filter(p => p.payment_status === "paid" || p.payment_status === "confirmed")
    .reduce((sum, p) => sum + p.amount, 0)

  const pendingAmount = payments
    .filter(p => p.payment_status === "pending" || p.payment_status === "processing")
    .reduce((sum, p) => sum + p.amount, 0)

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading payment information...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <p className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
              <p className="text-sm text-green-700 dark:text-green-300">Confirmed Payments</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">${pendingAmount.toFixed(2)}</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">Pending Confirmation</p>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">${(estimatedCost || 0).toFixed(2)}</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">Project Total</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Payment Transactions ({payments.length})
          </CardTitle>
          <CardDescription>
            All payment attempts and confirmations for this service request
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <div className="space-y-6">
              {payments.map((payment) => (
                <div key={payment.id} className="border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        {getPaymentMethodIcon(payment.payment_method)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-lg">
                            ${payment.amount.toFixed(2)} {payment.currency}
                          </span>
                          <Badge className={getStatusColor(payment.payment_status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(payment.payment_status)}
                              {payment.payment_status.replace("_", " ")}
                            </span>
                          </Badge>
                          {payment.payment_type && (
                            <Badge variant="outline">
                              {payment.payment_type === "split" ? "Split Payment (50%)" : "Full Payment"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {payment.payment_method.replace("_", " ").toUpperCase()} • 
                          Created: {new Date(payment.created_at).toLocaleString()}
                        </p>
                        {payment.stripe_payment_intent_id && (
                          <p className="text-xs text-muted-foreground">
                            Stripe ID: {payment.stripe_payment_intent_id}
                          </p>
                        )}
                        {payment.paystack_reference && (
                          <p className="text-xs text-muted-foreground">
                            Paystack Ref: {payment.paystack_reference}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {payment.error_message && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Error:</strong> {payment.error_message}
                      </AlertDescription>
                    </Alert>
                  )}

                  {payment.admin_notes && (
                    <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium mb-1">Admin Notes:</p>
                      <p className="text-sm">{payment.admin_notes}</p>
                      {payment.confirmed_by && payment.confirmed_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Confirmed by {payment.confirmed_by} on {new Date(payment.confirmed_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Admin Actions for Pending Payments */}
                  {(payment.payment_status === "pending" || payment.payment_status === "processing") && (
                    <div className="space-y-3 pt-4 border-t">
                      <Label htmlFor={`notes-${payment.id}`}>Admin Notes (Optional)</Label>
                      <Textarea
                        id={`notes-${payment.id}`}
                        placeholder="Add notes about this payment verification..."
                        value={adminNotes[payment.id] || ""}
                        onChange={(e) => setAdminNotes({
                          ...adminNotes,
                          [payment.id]: e.target.value
                        })}
                        className="text-sm"
                        rows={2}
                      />
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updatePaymentStatus(
                            payment.id, 
                            "confirmed", 
                            adminNotes[payment.id] || "Payment verified and confirmed by admin"
                          )}
                          disabled={processingPayment === payment.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          {processingPayment === payment.id ? "Confirming..." : "Confirm Payment"}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updatePaymentStatus(
                            payment.id, 
                            "declined", 
                            adminNotes[payment.id] || "Payment declined by admin"
                          )}
                          disabled={processingPayment === payment.id}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Decline Payment
                        </Button>

                        {payment.payment_method === "bank_transfer" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Open proof of payment viewing modal/link
                              alert("Feature to view proof of payment - to be implemented")
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Proof
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No payments yet</h3>
              <p className="text-muted-foreground">Payment records will appear here once clients make payments.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Note:</strong> All payments require manual admin confirmation for security. 
          Even successful Stripe/Paystack payments should be verified before marking projects as paid. 
          Bank transfers require proof of payment verification.
        </AlertDescription>
      </Alert>
    </div>
  )
}