// app/payment/success/page.tsx - Payment Success Page
"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  CheckCircle, 
  Download, 
  Mail, 
  ArrowRight,
  Clock,
  CreditCard,
  Building,
  User
} from "lucide-react"
import Link from "next/link"

interface PaymentInfo {
  id: string
  amount: number
  currency: string
  payment_method: string
  payment_type: string
  payment_status: string
  created_at: string
  confirmed_at: string
  service_requests: {
    id: string
    title: string
    service_category: string
    estimated_cost: number
    clients: {
      name: string
      email: string
    }
  }
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('payment_id')
  const paymentType = searchParams.get('type')
  
  const [payment, setPayment] = useState<PaymentInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (paymentId) {
      fetchPaymentInfo()
    } else {
      setError("No payment ID provided")
      setIsLoading(false)
    }
  }, [paymentId])

  const fetchPaymentInfo = async () => {
    try {
      const response = await fetch(`/api/payments/${paymentId}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch payment information")
      }
      
      const data = await response.json()
      setPayment(data)
    } catch (err) {
      console.error("Error fetching payment info:", err)
      setError("Unable to load payment information")
    } finally {
      setIsLoading(false)
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'paystack':
        return <CreditCard className="h-5 w-5" />
      case 'bank_transfer':
        return <Building className="h-5 w-5" />
      case 'crypto':
        return <CreditCard className="h-5 w-5" />
      default:
        return <CreditCard className="h-5 w-5" />
    }
  }

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'paystack':
        return 'Paystack'
      case 'bank_transfer':
        return 'Bank Transfer'
      default:
        return method.replace('_', ' ').toUpperCase()
    }
  }

  const getNextSteps = () => {
    if (!payment) return []

    const steps = [
      "We've received your payment and will process it within 24 hours",
      "You'll receive an email confirmation with payment receipt",
      "Our team will begin work on your project shortly"
    ]

    if (payment.payment_type === 'split') {
      steps.push("The remaining 50% will be due upon project completion")
    } else {
      steps.push("Your project is fully paid and will receive priority handling")
    }

    return steps
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-primary border-t-transparent mx-auto mb-4"></div>
            <h3 className="font-semibold text-lg mb-2">Processing Payment</h3>
            <p className="text-muted-foreground">Confirming your payment details...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-red-900/20 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm max-w-lg w-full">
          <CardContent className="p-8 text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <Mail className="h-10 w-10 text-red-600" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-3 text-red-900">Unable to Load Payment</h2>
              <p className="text-red-700 mb-6">{error}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="flex-1" size="lg">
                <Link href="/contact">
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Support
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1" size="lg">
                <Link href="/">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Go Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-green-600 mb-2">Payment Successful!</h1>
            <p className="text-xl text-muted-foreground mb-2">
              Your payment has been processed successfully
            </p>
            <Badge className="bg-green-100 text-green-800">
              Payment ID: {payment.id}
            </Badge>
          </div>

          {/* Payment Details */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Amount Paid:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${payment.amount.toFixed(2)} {payment.currency.toUpperCase()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Payment Method:</span>
                  <div className="flex items-center gap-2">
                    {getPaymentMethodIcon(payment.payment_method)}
                    <span>{getPaymentMethodName(payment.payment_method)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span>Payment Type:</span>
                  <Badge variant={payment.payment_type === 'full' ? 'default' : 'secondary'}>
                    {payment.payment_type === 'split' ? '50% Upfront' : 'Full Payment'}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span>Status:</span>
                  <Badge className="bg-green-100 text-green-800">
                    {payment.payment_status === 'confirmed' ? 'Confirmed' : payment.payment_status}
                  </Badge>
                </div>

                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Transaction Time:</span>
                  <span>{new Date(payment.confirmed_at || payment.created_at).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Service Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Service Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-1">{payment.service_requests.title}</h4>
                  <Badge variant="outline" className="mb-3">
                    {payment.service_requests.service_category}
                  </Badge>
                </div>

                <div>
                  <span className="text-sm text-muted-foreground">Client:</span>
                  <p className="font-medium">{payment.service_requests.clients.name}</p>
                  <p className="text-sm text-muted-foreground">{payment.service_requests.clients.email}</p>
                </div>

                <div className="flex justify-between items-center">
                  <span>Project Cost:</span>
                  <span className="font-medium">${payment.service_requests.estimated_cost.toFixed(2)}</span>
                </div>

                {payment.payment_type === 'split' && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex justify-between items-center text-sm">
                      <span>Remaining Balance:</span>
                      <span className="font-medium text-blue-600">
                        ${(payment.service_requests.estimated_cost - payment.amount).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">Due upon project completion</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Next Steps */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                What Happens Next?
              </CardTitle>
              <CardDescription>
                Here's what you can expect moving forward
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getNextSteps().map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <p className="text-sm">{step}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  📧 Email Confirmation
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-200">
                  A detailed receipt and project timeline will be sent to{" "}
                  <strong>{payment.service_requests.clients.email}</strong> within the next few minutes.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Button size="lg" className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Download Receipt
            </Button>
            
            <Button asChild size="lg" variant="outline" className="flex-1">
              <Link href={`/service-requests/${payment.service_requests.id}`}>
                <ArrowRight className="mr-2 h-4 w-4" />
                View Project Status
              </Link>
            </Button>

            <Button asChild size="lg" variant="outline" className="flex-1">
              <Link href="/contact">
                <Mail className="mr-2 h-4 w-4" />
                Contact Support
              </Link>
            </Button>
          </div>

          {/* Contact Information */}
          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="font-semibold mb-2">Need Help?</h3>
              <p className="text-muted-foreground mb-4">
                If you have any questions about your payment or project, we're here to help.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
                <a 
                  href="mailto:hello@kamisoftenterprises.online" 
                  className="text-primary hover:underline flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  hello@kamisoftenterprises.online
                </a>
                <span className="hidden sm:block">•</span>
                <span className="text-muted-foreground">
                  Response time: Within 24 hours
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}