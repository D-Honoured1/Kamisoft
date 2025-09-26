// app/admin/requests/[id]/page.tsx - UPDATED WITH PAYMENT MANAGEMENT
export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server-auth"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Mail, Phone, DollarSign, User, ArrowLeft, FileText, Clock, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { PaymentLinkGenerator } from "@/components/admin/payment-link-generator"
import { PaymentLinkDeactivator } from "@/components/admin/payment-link-deactivator"
import { PaymentDeleter } from "@/components/admin/payment-deleter"
import { PaymentApprover } from "@/components/admin/payment-approver"
import { CryptoPaymentVerifier } from "@/components/admin/crypto-payment-verifier"

interface ServiceRequestDetailProps {
  params: {
    id: string
  }
}

export default async function ServiceRequestDetail({ params }: ServiceRequestDetailProps) {
  await requireAuth()
  const supabase = createServerClient()

  // Get the service request
  const { data: request, error: requestError } = await supabase
    .from("service_requests")
    .select("*")
    .eq("id", params.id)
    .single()

  if (requestError || !request) {
    notFound()
  }

  // Get client information separately
  let client = null
  if (request.client_id) {
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", request.client_id)
      .single()
    
    if (!clientError && clientData) {
      client = clientData
    }
  }

  // Get payments separately
  let payments = []
  const { data: paymentsData, error: paymentsError } = await supabase
    .from("payments")
    .select(`
      *,
      crypto_address,
      crypto_network,
      crypto_amount,
      crypto_symbol,
      crypto_transaction_hash,
      crypto_confirmations
    `)
    .eq("request_id", request.id)

  if (!paymentsError && paymentsData) {
    payments = paymentsData
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "cancelled":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      case "declined":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "approved":
        return <CheckCircle className="h-4 w-4" />
      case "in_progress":
        return <FileText className="h-4 w-4" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
      case "declined":
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const requestType = request.request_type || 'digital'
  const hasPayments = payments && payments.length > 0
  const canGeneratePayment = request.status === "approved" && request.estimated_cost > 0

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Service Request Details</h1>
          <p className="text-muted-foreground mt-2">Request #{request.id.slice(0, 8)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/requests">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Requests
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Request Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {request.title || 'Service Request'}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Submitted on {new Date(request.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Service Request
                  </Badge>
                  {request.priority && (
                    <Badge className={getPriorityColor(request.priority)}>
                      {request.priority} priority
                    </Badge>
                  )}
                  <Badge className={getStatusColor(request.status)}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(request.status)}
                      {request.status.replace("_", " ")}
                    </span>
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Service Category</h4>
                  <p className="text-sm bg-muted/50 rounded-lg p-3">
                    {request.service_category?.replace('_', ' ') || 'Not specified'}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-2">Project Description</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {request.description || 'No description provided'}
                  </p>
                </div>

                {request.requirements && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Requirements</h4>
                    <p className="text-muted-foreground leading-relaxed">{request.requirements}</p>
                  </div>
                )}

                {request.timeline && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Timeline</h4>
                    <p className="text-muted-foreground">{request.timeline}</p>
                  </div>
                )}

                {request.budget_range && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Budget Range</h4>
                    <p className="text-muted-foreground">{request.budget_range}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Request Type</h4>
                    <Badge variant="outline">
                      {requestType === 'digital' ? 'Digital/Remote' : 'On-Site'}
                    </Badge>
                  </div>
                  {request.preferred_date && (
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Preferred Date</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(request.preferred_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* On-Site Service Details */}
          {requestType === "on_site" && request.site_address && (
            <Card>
              <CardHeader>
                <CardTitle>On-Site Service Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Service Address</p>
                    <p className="text-muted-foreground">{request.site_address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Link Generator - Only show for appropriate statuses */}
          {(request.status === "approved" || request.status === "pending") && (
            <PaymentLinkGenerator
              requestId={request.id}
              currentCost={request.estimated_cost}
              clientEmail={client?.email}
              clientName={client?.name}
              status={request.status}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent>
              {client ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{client.name}</p>
                      {client.company && (
                        <p className="text-sm text-muted-foreground">{client.company}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="text-muted-foreground">{client.email}</p>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <p className="text-muted-foreground">{client.phone}</p>
                    </div>
                  )}
                  <div className="pt-4 border-t mt-4">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={`/admin/clients/${client.id}`}>
                        View Client Profile
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm">
                    No client information available
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {request.estimated_cost && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Estimated Cost</p>
                      <p className="text-muted-foreground">${request.estimated_cost.toLocaleString()}</p>
                    </div>
                  </div>
                )}

                {hasPayments && (
                  <div>
                    <p className="font-medium text-foreground mb-2">Payments ({payments.length})</p>
                    {payments.map((payment: any) => (
                      <div key={payment.id} className="flex items-center justify-between p-2 border rounded mb-2">
                        <div>
                          <p className="text-sm font-medium">${payment.amount.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{payment.payment_method || 'N/A'}</p>
                        </div>
                        <Badge
                          className={
                            payment.payment_status === "completed" || payment.payment_status === "confirmed"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : payment.payment_status === "failed"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          }
                        >
                          {payment.payment_status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {(!hasPayments && request.status === "approved") && (
                  <div className="text-center py-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Ready for payment link generation
                    </p>
                  </div>
                )}

                {(!hasPayments && request.status === "pending") && (
                  <p className="text-sm text-muted-foreground">No payments - approve request first</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Link Deactivator - Show if payment link exists */}
          {request.payment_link_expiry && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Link Management</CardTitle>
                <CardDescription>
                  Manage active payment links for this request
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PaymentLinkDeactivator
                  requestId={request.id}
                  currentStatus={request.status}
                  paymentLinkExpiry={request.payment_link_expiry}
                />
              </CardContent>
            </Card>
          )}

          {/* Payments Awaiting Approval */}
          {(() => {
            const approvablePayments = payments.filter((payment: any) =>
              ['success', 'completed', 'pending', 'processing'].includes(payment.payment_status) &&
              payment.payment_status !== 'confirmed'
            )
            return approvablePayments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Payments Awaiting Approval</CardTitle>
                  <CardDescription>
                    Approve and confirm payments (Paystack, bank transfer, crypto)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {approvablePayments.map((payment: any) => (
                      <PaymentApprover
                        key={payment.id}
                        paymentId={payment.id}
                        paymentStatus={payment.payment_status}
                        amount={payment.amount}
                        currency={payment.currency || 'USD'}
                        paymentMethod={payment.payment_method}
                        paymentType={payment.payment_type}
                        paystackReference={payment.paystack_reference}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })()}

          {/* Crypto Payment Verification */}
          {(() => {
            const cryptoPayments = payments.filter((payment: any) =>
              payment.payment_method === 'crypto' && payment.payment_status === 'processing'
            )
            return cryptoPayments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Crypto Payment Verification</CardTitle>
                  <CardDescription>
                    Verify blockchain transactions for crypto payments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cryptoPayments.map((payment: any) => (
                      <CryptoPaymentVerifier
                        key={payment.id}
                        paymentId={payment.id}
                        paymentStatus={payment.payment_status}
                        amount={payment.amount}
                        currency={payment.currency || 'USD'}
                        cryptoAddress={payment.crypto_address}
                        cryptoNetwork={payment.crypto_network}
                        cryptoAmount={payment.crypto_amount}
                        cryptoSymbol={payment.crypto_symbol}
                        cryptoTransactionHash={payment.crypto_transaction_hash}
                        paymentMethod={payment.payment_method}
                        metadata={payment.metadata}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })()}

          {/* Failed/Cancelled Payments Management */}
          {(() => {
            const failedPayments = payments.filter((payment: any) =>
              ['failed', 'cancelled', 'pending'].includes(payment.payment_status)
            )
            return failedPayments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Failed/Cancelled Payments</CardTitle>
                  <CardDescription>
                    Manage and clean up failed or cancelled payment attempts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {failedPayments.map((payment: any) => (
                      <PaymentDeleter
                        key={payment.id}
                        paymentId={payment.id}
                        paymentStatus={payment.payment_status}
                        amount={payment.amount}
                        currency={payment.currency || 'USD'}
                        paymentMethod={payment.payment_method}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })()}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button className="w-full" asChild>
                  <Link href={`/admin/requests/${request.id}/edit`}>Update Status & Details</Link>
                </Button>
                
                {canGeneratePayment && !hasPayments && (
                  <Badge variant="secondary" className="w-full justify-center py-2">
                    Payment link ready to generate above
                  </Badge>
                )}
                
                {hasPayments && (
                  <Button variant="outline" className="w-full bg-transparent" asChild>
                    <Link href={`/payment/${request.id}`} target="_blank">View Payment Page</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}