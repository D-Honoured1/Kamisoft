// app/payment/cancelled/page.tsx - Payment Cancelled/Failed Page
"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  XCircle, 
  RefreshCw,
  ArrowLeft,
  Mail,
  CreditCard,
  AlertTriangle,
  Clock,
  Building,
  Wallet
} from "lucide-react"
import Link from "next/link"

interface PaymentInfo {
  id: string
  amount: number
  payment_method: string
  payment_type: string
  payment_status: string
  error_message?: string
  service_requests: {
    id: string
    title: string
    estimated_cost: number
    clients: {
      name: string
      email: string
    }
  }
}

export default function PaymentCancelledPage() {
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('payment_id')
  const reason = searchParams.get('reason') // 'cancelled', 'failed', 'timeout'
  
  const [payment, setPayment] = useState<PaymentInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    if (paymentId) {
      fetchPaymentInfo()
    } else {
      setIsLoading(false)
    }
  }, [paymentId])

  const fetchPaymentInfo = async () => {
    try {
      const response = await fetch(`/api/payments/${paymentId}`)
      
      if (response.ok) {
        const data = await response.json()
        setPayment(data)
      }
    } catch (err) {
      console.error("Error fetching payment info:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const getReasonInfo = () => {
    switch (reason) {
      case 'failed':
        return {
          title: 'Payment Failed',
          description: 'Your payment could not be processed',
          icon: <XCircle className="h-12 w-12 text-red-600" />,
          color: 'red'
        }
      case 'timeout':
        return {
          title: 'Payment Timeout',
          description: 'The payment session has expired',
          icon: <Clock className="h-12 w-12 text-orange-600" />,
          color: 'orange'
        }
      default:
        return {
          title: 'Payment Cancelled',
          description: 'You have cancelled the payment process',
          icon: <XCircle className="h-12 w-12 text-gray-600" />,
          color: 'gray'
        }
    }
  }

  const handleRetryPayment = async () => {
    if (!payment) return

    setIsRetrying(true)
    
    // Redirect back to payment page
    window.location.href = `/payment/${payment.service_requests.id}`
  }

  const getAlternativePaymentMethods = () => {
    if (!payment) return []

    const current = payment.payment_method
    const methods = [
      { id: 'stripe', name: 'Credit/Debit Card', icon: <CreditCard className="h-5 w-5" />, description: 'Visa, MasterCard, American Express' },
      { id: 'paystack', name: 'Paystack', icon: <Wallet className="h-5 w-5" />, description: 'Cards, Bank Transfer, USSD' },
      { id: 'bank_transfer', name: 'Bank Transfer', icon: <Building className="h-5 w-5" />, description: 'Direct bank transfer' }
    ]

    return methods.filter(method => method.id !== current)
  }

  const reasonInfo = getReasonInfo()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-primary border-t-transparent mx-auto mb-4"></div>
            <h3 className="font-semibold text-lg mb-2">Loading Payment Information</h3>
            <p className="text-muted-foreground">Please wait...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
              {reasonInfo.icon}
            </div>
            <h1 className="text-4xl font-bold text-red-600 mb-2">{reasonInfo.title}</h1>
            <p className="text-xl text-muted-foreground mb-4">
              {reasonInfo.description}
            </p>
            
            {payment && (
              <Badge variant="outline" className="mb-4">
                Payment ID: {payment.id}
              </Badge>
            )}
          </div>

          {/* Error Details */}
          {payment?.error_message && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                <strong>Error Details:</strong> {payment.error_message}
              </AlertDescription>
            </Alert>
          )}

          {/* Payment Information */}
          {payment && (
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-medium">${payment.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Type:</span>
                    <Badge variant="secondary">
                      {payment.payment_type === 'split' ? '50% Upfront' : 'Full Payment'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant="destructive">
                      {payment.payment_status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Service Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium">{payment.service_requests.title}</p>
                  </div>
                  <div className="flex justify-between">
                    <span>Project Cost:</span>
                    <span className="font-medium">${payment.service_requests.estimated_cost.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Client:</span>
                    <p className="font-medium">{payment.service_requests.clients.name}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="flex-1"
                onClick={handleRetryPayment}
                disabled={isRetrying || !payment}
              >
                {isRetrying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Redirecting...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </>
                )}
              </Button>

              <Button asChild size="lg" variant="outline" className="flex-1">
                <Link href="/contact">
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Support
                </Link>
              </Button>

              <Button asChild size="lg" variant="ghost" className="flex-1">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Home
                </Link>
              </Button>
            </div>
          </div>

          {/* Alternative Payment Methods */}
          {payment && getAlternativePaymentMethods().length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Try a Different Payment Method</CardTitle>
                <CardDescription>
                  Sometimes switching payment methods can resolve the issue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getAlternativePaymentMethods().map((method) => (
                    <div key={method.id} className="p-4 border rounded-lg hover:bg-accent cursor-pointer">
                      <div className="flex items-center gap-3 mb-2">
                        {method.icon}
                        <span className="font-medium">{method.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </div>
                  ))}
                </div>
                
                <Button 
                  onClick={handleRetryPayment}
                  className="w-full mt-4"
                  variant="outline"
                  disabled={isRetrying}
                >
                  Choose Different Method
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Common Issues & Solutions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Common Issues & Solutions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium">Card Declined</h4>
                  <p className="text-sm text-muted-foreground">
                    Check your card details, available balance, or try a different card. 
                    Contact your bank if the issue persists.
                  </p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-medium">Network Issues</h4>
                  <p className="text-sm text-muted-foreground">
                    Poor internet connection can cause payment failures. 
                    Try again with a stable connection.
                  </p>
                </div>
                
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-medium">Session Timeout</h4>
                  <p className="text-sm text-muted-foreground">
                    Payment sessions expire after 30 minutes for security. 
                    Start a new payment process.
                  </p>
                </div>

                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-medium">Bank Transfer</h4>
                  <p className="text-sm text-muted-foreground">
                    For manual verification, choose bank transfer and we'll send you 
                    account details via email.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="font-semibold mb-2">Still Having Issues?</h3>
              <p className="text-muted-foreground mb-4">
                Our support team is ready to help you complete your payment.
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
                  Average response time: 2 hours
                </span>
              </div>
              
              {payment && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>Reference ID:</strong> {payment.id} | 
                    <strong> Service:</strong> {payment.service_requests.title}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}