"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Building,
  DollarSign,
  Calendar,
  FileText,
  CheckCircle,
  AlertCircle,
  Plus,
  CreditCard
} from "lucide-react"

interface ManualPaymentEntryProps {
  requestId: string
  estimatedCost: number
  totalPaid: number
  balanceDue: number
  clientName: string
}

export function ManualPaymentEntry({
  requestId,
  estimatedCost,
  totalPaid,
  balanceDue,
  clientName
}: ManualPaymentEntryProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form fields
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"bank_transfer" | "cash" | "cheque" | "other">("bank_transfer")
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [reference, setReference] = useState("")
  const [bankName, setBankName] = useState("")
  const [depositSlip, setDepositSlip] = useState("")
  const [notes, setNotes] = useState("")
  const [paymentType, setPaymentType] = useState<"partial" | "full" | "remaining">("partial")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const paymentAmount = parseFloat(amount)
    if (!paymentAmount || paymentAmount <= 0) {
      setError("Please enter a valid payment amount")
      return
    }

    if (paymentAmount > balanceDue && paymentType !== "full") {
      setError(`Payment amount ($${paymentAmount}) cannot exceed balance due ($${balanceDue})`)
      return
    }

    if (!reference.trim()) {
      setError("Please enter a payment reference/transaction ID")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/admin/payments/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          amount: paymentAmount,
          paymentMethod,
          paymentDate,
          reference,
          bankName: paymentMethod === "bank_transfer" ? bankName : undefined,
          depositSlip: depositSlip || undefined,
          notes: notes || undefined,
          paymentType,
          adminVerified: true, // Manual entries are pre-verified by admin
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to record payment")
      }

      await response.json()
      setSuccess(`Payment of $${paymentAmount} recorded successfully`)

      // Reset form
      setAmount("")
      setReference("")
      setBankName("")
      setDepositSlip("")
      setNotes("")
      setIsOpen(false)

      // Refresh the page to show updated data
      setTimeout(() => {
        router.refresh()
      }, 1000) // Give time for user to see success message

    } catch (error: any) {
      console.error("Error recording manual payment:", error)
      setError(error.message || "Failed to record payment")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Manual Payment Entry
          </CardTitle>
          <CardDescription>
            Record bank transfers, cash payments, or other manual payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Payment Summary */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-lg font-bold">${estimatedCost.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-lg font-bold text-green-600">${totalPaid.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Balance Due</p>
                <p className="text-lg font-bold text-orange-600">${balanceDue.toFixed(2)}</p>
              </div>
            </div>

            {success && (
              <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <Button onClick={() => setIsOpen(true)} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Record Manual Payment
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Record Manual Payment
        </CardTitle>
        <CardDescription>
          Record a payment received outside the automated system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Type */}
          <div className="space-y-3">
            <Label>Payment Type</Label>
            <RadioGroup value={paymentType} onValueChange={(value) => setPaymentType(value as typeof paymentType)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="partial" id="partial" />
                <Label htmlFor="partial">Partial Payment (Custom Amount)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="remaining" id="remaining" />
                <Label htmlFor="remaining">Remaining Balance (${balanceDue.toFixed(2)})</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full">Full Payment (${estimatedCost.toFixed(2)})</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Payment Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount (USD) *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder={
                  paymentType === "remaining" ? balanceDue.toFixed(2) :
                  paymentType === "full" ? estimatedCost.toFixed(2) : "0.00"
                }
                value={
                  paymentType === "remaining" ? balanceDue.toFixed(2) :
                  paymentType === "full" ? estimatedCost.toFixed(2) : amount
                }
                onChange={(e) => setAmount(e.target.value)}
                disabled={paymentType !== "partial"}
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <Label>Payment Method *</Label>
            <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as typeof paymentMethod)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                <Label htmlFor="bank_transfer" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Bank Transfer
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Cash Payment
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cheque" id="cheque" />
                <Label htmlFor="cheque" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Cheque
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Other
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label htmlFor="paymentDate">Payment Date *</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Reference/Transaction ID */}
          <div className="space-y-2">
            <Label htmlFor="reference">Transaction Reference/ID *</Label>
            <Input
              id="reference"
              placeholder="e.g., TXN123456, Deposit slip #, Receipt #"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              required
            />
          </div>

          {/* Bank Name (for bank transfers) */}
          {paymentMethod === "bank_transfer" && (
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                placeholder="e.g., First Bank, GTBank, Access Bank"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>
          )}

          {/* Deposit Slip/Receipt */}
          <div className="space-y-2">
            <Label htmlFor="depositSlip">Deposit Slip/Receipt Number</Label>
            <Input
              id="depositSlip"
              placeholder="Optional: Receipt or deposit slip reference"
              value={depositSlip}
              onChange={(e) => setDepositSlip(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information about this payment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}