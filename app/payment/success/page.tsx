// app/payment/success/page.tsx - ENHANCED VERSION WITH PAYMENT TYPE INFO
"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Download, Mail, ArrowRight, Calendar, DollarSign, Tag, Info } from "lucide-react"
import Link from "next/link"

interface PaymentDetails {
  id: string
  amount: number
  currency: string
  status: string
  invoiceNumber: string
  serviceTitle: string
  paymentType: "split" | "full"
  originalAmount?: number
  savings?: number
  remainingAmount?: number
  discountPercent?: number
  upfrontPercent?: number
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const paymentId = searchParams.get("payment_id")
    const sessionId = searchParams.get("session_id")
    const paymentType = searchParams.get("type") as "split" | "full" || "split"

    if (paymentId || sessionId) {
      fetchPaymentDetails(paymentId || sessionId, paymentType)
    } else {
      setIsLoading(false)
    }
  }, [searchParams])

  const fetchPaymentDetails = async (id: string, paymentType: "split" | "full") => {
    try {
      // TODO: Implement API call to fetch payment details
      console.log("Fetching payment details for:", id, "Type:", paymentType)

      // Mock data based on payment type
      const mockDetails: PaymentDetails = {
        id: id,
        amount: paymentType === "split" ? 1250.0 : 2250.0,
        currency: "USD",
        status: "completed",
        invoiceNumber: "KE-2024-1001",
        serviceTitle: "E-commerce Website Development",
        paymentType: paymentType,
        originalAmount: 2500.0,
        ...(paymentType === "split" && {
          upfrontPercent: 50,
          remainingAmount: 1250.0
        }),
        ...(paymentType === "full" && {
          discountPercent: 10,
          savings: 250.0
        })
      }

      setPaymentDetails(mockDetails)
    } catch (error) {
      console.error("Error fetching payment details:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 py-12">
        <div className="container max-w-2xl">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Confirming your payment...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 py-12">
      <div className="container max-w-3xl">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>

            <div>
              <h1 className="text-3xl font-bold mb-2 text-green-600">Payment Successful!</h1>
              <p className="text-muted-foreground text-lg">
                Thank you for your payment. Your transaction has been processed successfully.
              </p>
            </div>

            {paymentDetails && (
              <div className="bg-muted/50 rounded-lg p-6 space-y-4 text-left max-w-2xl mx-auto">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Payment Details</h3>
                  <Badge className={
                    paymentDetails.paymentType === "full" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-blue-100 text-blue-800"
                  }>
                    {paymentDetails.paymentType === "full" ? "Full Payment" : "Split Payment"}
                  </Badge>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service:</span>
                      <span className="font-medium">{paymentDetails.serviceTitle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Invoice:</span>
                      <span className="font-medium">{paymentDetails.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="text-green-600 font-medium flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Paid
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Project Total:</span>
                      <span className="font-medium">${paymentDetails.originalAmount?.toFixed(2) || paymentDetails.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount Paid:</span>
                      <span className="font-bold text-lg text-primary">
                        ${paymentDetails.amount.toFixed(2)} {paymentDetails.currency}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Date:</span>
                      <span className="font-medium">{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Type Specific Information */}
                {paymentDetails.paymentType === "split" && paymentDetails.remainingAmount && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-start gap-3">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-blue-900 dark:text-blue-100 text-sm">Split Payment ({paymentDetails.upfrontPercent}% Paid)</p>
                        <p className="text-blue-700 dark:text-blue-200 text-sm mt-1">
                          Remaining balance: <span className="font-bold">${paymentDetails.remainingAmount.toFixed(2)}</span>
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-300 mt-2">
                          The remaining amount will be due upon project completion.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {paymentDetails.paymentType === "full" && paymentDetails.savings && (
                  <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border border-green-200">
                    <div className="flex items-start gap-3">
                      <Tag className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-green-900 dark:text-green-100 text-sm">Full Payment Discount Applied</p>
                        <p className="text-green-700 dark:text-green-200 text-sm mt-1">
                          You saved: <span className="font-bold">${paymentDetails.savings.toFixed(2)}</span> ({paymentDetails.discountPercent}% discount)
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-300 mt-2">
                          No additional payments required. Your project is fully paid!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 text-sm max-w-2xl mx-auto">
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-medium text-blue-900 dark:text-blue-100">What happens next?</p>
                    <ul className="mt-2 space-y-1 text-blue-700 dark:text-blue-200">
                      <li>• You'll receive an email confirmation with your invoice</li>
                      <li>• Our team will begin work on your project within 24 hours</li>
                      <li>• You'll be assigned a project manager who will contact you</li>
                      <li>• Regular updates will be provided throughout the project</li>
                      {paymentDetails?.paymentType === "split" && (
                        <li className="font-medium">• Final payment will be requested upon project completion</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Button variant="outline" className="flex-1 bg-transparent">
                  <Download className="mr-2 h-4 w-4" />
                  Download Invoice
                </Button>
                <Button asChild className="flex-1">
                  <Link href="/">
                    Back to Home <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground pt-4 border-t">
              <p>
                Need help? Contact us at{" "}
                <a href="mailto:hello@kamisoftenterprises.online" className="text-primary hover:underline">
                  hello@kamisoftenterprises.online
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}