"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"

export default function PaymentCancelledPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 py-12">
      <div className="container max-w-2xl">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>

            <div>
              <h1 className="text-2xl font-bold mb-2">Payment Cancelled</h1>
              <p className="text-muted-foreground">
                Your payment was cancelled. No charges have been made to your account.
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-6">
              <h3 className="font-semibold mb-3">What you can do:</h3>
              <ul className="text-sm text-muted-foreground space-y-2 text-left">
                <li>• Try a different payment method</li>
                <li>• Check your card details and try again</li>
                <li>• Contact your bank if you're having issues</li>
                <li>• Reach out to us for alternative payment options</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Button onClick={() => router.back()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>
                Need assistance? Contact us at{" "}
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
