"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Building,
  DollarSign,
  Calendar,
  FileText,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2
} from "lucide-react"

interface ManualPayment {
  id: string
  amount: number
  payment_method: string
  payment_status: string
  created_at: string
  metadata?: string
}

interface ManualPaymentHistoryProps {
  payments: ManualPayment[]
}

export function ManualPaymentHistory({ payments }: ManualPaymentHistoryProps) {
  const [selectedPayment, setSelectedPayment] = useState<ManualPayment | null>(null)

  // Filter for manual payments only
  const manualPayments = payments.filter(payment => {
    try {
      const metadata = JSON.parse(payment.metadata || "{}")
      return metadata.manualEntry === true
    } catch {
      return false
    }
  })

  if (manualPayments.length === 0) {
    return null
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "bank_transfer":
        return <Building className="h-4 w-4" />
      case "cash":
        return <DollarSign className="h-4 w-4" />
      case "cheque":
        return <FileText className="h-4 w-4" />
      default:
        return <DollarSign className="h-4 w-4" />
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "bank_transfer":
        return "Bank Transfer"
      case "cash":
        return "Cash Payment"
      case "cheque":
        return "Cheque"
      default:
        return method.charAt(0).toUpperCase() + method.slice(1)
    }
  }

  const formatPaymentMethod = (method: string) => {
    return method.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const parseMetadata = (metadataString?: string) => {
    try {
      return JSON.parse(metadataString || "{}")
    } catch {
      return {}
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Manual Payment History
        </CardTitle>
        <CardDescription>
          Payments recorded manually by administrators
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {manualPayments.map((payment) => {
            const metadata = parseMetadata(payment.metadata)
            const paymentDate = metadata.paymentDate || payment.created_at.split('T')[0]

            return (
              <div key={payment.id} className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        {getPaymentMethodIcon(payment.payment_method)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">${payment.amount.toFixed(2)}</span>
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Manual Entry
                          </Badge>
                          <Badge
                            className={
                              payment.payment_status === "completed"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            }
                          >
                            {payment.payment_status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {getPaymentMethodLabel(payment.payment_method)} • {paymentDate}
                        </div>
                      </div>
                    </div>

                    {/* Payment Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                      {metadata.reference && (
                        <div>
                          <span className="text-muted-foreground">Reference:</span>
                          <div className="font-mono text-xs bg-white dark:bg-gray-800 p-1 rounded border">
                            {metadata.reference}
                          </div>
                        </div>
                      )}

                      {metadata.bankName && (
                        <div>
                          <span className="text-muted-foreground">Bank:</span>
                          <div className="font-medium">{metadata.bankName}</div>
                        </div>
                      )}

                      {metadata.depositSlip && (
                        <div>
                          <span className="text-muted-foreground">Receipt/Slip:</span>
                          <div className="font-mono text-xs">{metadata.depositSlip}</div>
                        </div>
                      )}

                      {metadata.paymentType && (
                        <div>
                          <span className="text-muted-foreground">Type:</span>
                          <div className="font-medium capitalize">{metadata.paymentType}</div>
                        </div>
                      )}
                    </div>

                    {metadata.notes && (
                      <div className="mt-3 p-2 bg-white dark:bg-gray-800 rounded border">
                        <span className="text-sm text-muted-foreground">Notes:</span>
                        <div className="text-sm mt-1">{metadata.notes}</div>
                      </div>
                    )}

                    {metadata.entryTimestamp && (
                      <div className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        Recorded: {new Date(metadata.entryTimestamp).toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPayment(selectedPayment?.id === payment.id ? null : payment)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      {selectedPayment?.id === payment.id ? "Hide" : "Details"}
                    </Button>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedPayment?.id === payment.id && (
                  <div className="mt-4 pt-4 border-t bg-white dark:bg-gray-800 p-3 rounded">
                    <h4 className="font-semibold mb-3">Payment Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Payment ID:</span>
                        <div className="font-mono text-xs">{payment.id}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <div className="font-medium">{payment.payment_status}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Method:</span>
                        <div className="font-medium">{formatPaymentMethod(payment.payment_method)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Amount:</span>
                        <div className="font-medium">${payment.amount.toFixed(2)}</div>
                      </div>
                    </div>

                    {metadata.adminVerified && (
                      <Alert className="mt-4 bg-green-50 dark:bg-green-950/20 border-green-200">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription className="text-green-800 dark:text-green-200">
                          This payment has been verified by an administrator
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {manualPayments.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground text-center">
              {manualPayments.length} manual payment{manualPayments.length !== 1 ? 's' : ''} recorded
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}