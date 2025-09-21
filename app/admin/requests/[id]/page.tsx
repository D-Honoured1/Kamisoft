// app/admin/requests/[id]/page.tsx - FIXED VERSION WITHOUT FOREIGN KEY ISSUES
export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server-auth"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Mail, Phone, DollarSign, User, ArrowLeft, FileText, Clock, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

interface ServiceRequestDetailProps {
  params: {
    id: string
  }
}

export default async function ServiceRequestDetail({ params }: ServiceRequestDetailProps) {
  // Require authentication
  const adminUser = await requireAuth()
  
  const supabase = createServerClient()

  console.log("=== SERVICE REQUEST DETAIL PAGE ===")
  console.log("Request ID:", params.id)

  // First, get the service request without joins
  const { data: request, error: requestError } = await supabase
    .from("service_requests")
    .select("*")
    .eq("id", params.id)
    .single()

  console.log("Service request query:", { request, requestError })

  if (requestError || !request) {
    console.error("Request not found:", requestError)
    notFound()
  }

  // Get client information separately if client_id exists
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
    console.log("Client query:", { client: clientData, clientError })
  }

  // Get payments separately if needed
  let payments = []
  const { data: paymentsData, error: paymentsError } = await supabase
    .from("payments")
    .select("*")
    .eq("request_id", request.id)

  if (!paymentsError && paymentsData) {
    payments = paymentsData
  }
  console.log("Payments query:", { payments: paymentsData, paymentsError })

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

                {/* Request Type and Additional Details */}
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

                {/* Raw Data Debug Info */}
                <details className="mt-6">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    Debug: Raw Request Data
                  </summary>
                  <pre className="mt-2 p-4 bg-muted/50 rounded text-xs overflow-x-auto">
                    {JSON.stringify(request, null, 2)}
                  </pre>
                </details>
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
                    Client ID: {request.client_id || 'Not specified'}
                  </p>
                  {request.client_id && (
                    <p className="text-xs text-red-600 mt-2">
                      Client data not found - possible foreign key issue
                    </p>
                  )}
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

                {payments && payments.length > 0 && (
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
                            payment.payment_status === "paid"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          }
                        >
                          {payment.payment_status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {(!payments || payments.length === 0) && (
                  <p className="text-sm text-muted-foreground">No payments recorded</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button className="w-full" asChild>
                  <Link href={`/admin/requests/${request.id}/edit`}>Update Status</Link>
                </Button>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href={`/payment/${request.id}`}>View Payment</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}