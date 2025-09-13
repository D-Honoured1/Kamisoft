"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Download, Mail, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const [paymentDetails, setPaymentDetails] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const paymentId = searchParams.get("payment_id")
    const sessionId = searchParams.get("session_id")

    if (paymentId || sessionId) {
      fetchPaymentDetails(paymentId || sessionId)
    } else {
      setIsLoading(false)
    }
  }, [searchParams])

  const fetchPaymentDetails = async (id: string) => {
    try {
      // TODO: Implement API call to fetch payment details
      console.log("Fetching payment details for:", id)

      // Mock data for now
      setPaymentDetails({
        id: id,
        amount: 2500.0,
        currency: "USD",
        status: "completed",
        invoiceNumber: "KE-2024-1001",
        serviceTitle: "E-commerce Website Development",
      })
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
      <div className="container max-w-2xl">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>

            <div>
              <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
              <p className="text-muted-foreground">
                Thank you for your payment. Your transaction has been processed successfully.
              </p>
            </div>

            {paymentDetails && (
              <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-lg">Payment Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service:</span>
                    <span>{paymentDetails.serviceTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-medium">
                      ${paymentDetails.amount.toFixed(2)} {paymentDetails.currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice:</span>
                    <span>{paymentDetails.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="text-green-600 font-medium">Paid</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 text-sm">
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">What happens next?</p>
                    <ul className="mt-2 space-y-1 text-blue-700 dark:text-blue-200">
                      <li>• You'll receive an email confirmation with your invoice</li>
                      <li>• Our team will begin work on your project within 24 hours</li>
                      <li>• You'll be assigned a project manager who will contact you</li>
                      <li>• Regular updates will be provided throughout the project</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
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

            <div className="text-center text-sm text-muted-foreground">
              <p>
                Need help? Contact us at{" "}
                <a href="mailto:hello@kamisoft.com" className="text-primary hover:underline">
                  hello@kamisoft.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
