// app/admin/clients/[id]/page.tsx - FIXED VERSION
export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server-auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Phone, Building, Calendar, FileText, DollarSign, User, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface ClientDetailPageProps {
  params: {
    id: string
  }
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  // Require authentication
  const adminUser = await requireAuth()
  
  const supabase = createServerClient()

  const { data: client, error } = await supabase
    .from("clients")
    .select(`
      *,
      service_requests (
        id,
        title,
        service_category,
        request_source,
        status,
        created_at,
        preferred_date
      ),
      payments (
        id,
        amount,
        currency,
        payment_status,
        created_at
      )
    `)
    .eq("id", params.id)
    .single()

  if (error || !client) {
    redirect("/admin/clients")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getSourceColor = (source: string) => {
    switch (source) {
      case "hire_us":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "contact":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const totalPayments = client.payments?.reduce((sum: number, payment: any) => {
    return payment.payment_status === 'paid' ? sum + payment.amount : sum
  }, 0) || 0

  const hireUsRequests = client.service_requests?.filter((req: any) => req.request_source === 'hire_us') || []
  const contactRequests = client.service_requests?.filter((req: any) => req.request_source === 'contact') || []

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/clients">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{client.name}</h1>
          <p className="text-muted-foreground mt-1">
            Client since {new Date(client.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Information */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{client.email}</span>
                </div>
                
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{client.phone}</span>
                  </div>
                )}
                
                {client.company && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{client.company}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Joined {new Date(client.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Service Requests</span>
                  <span className="font-medium">{hireUsRequests.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Contact Inquiries</span>
                  <span className="font-medium">{contactRequests.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Paid</span>
                  <span className="font-medium">${totalPayments.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Last Updated</span>
                  <span className="font-medium">
                    {new Date(client.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Service Requests and Payments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Requests (Hire Us) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Service Requests ({hireUsRequests.length})
              </CardTitle>
              <CardDescription>
                Requests from the "Hire Us" form
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hireUsRequests.length > 0 ? (
                <div className="space-y-4">
                  {hireUsRequests.map((request: any) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-foreground">{request.title}</h4>
                          <p className="text-sm text-muted-foreground">{request.service_category}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getSourceColor(request.request_source)}>
                            {request.request_source === 'hire_us' ? 'Service Request' : 'Contact'}
                          </Badge>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Created: {new Date(request.created_at).toLocaleDateString()}
                        </span>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/admin/requests/${request.id}`}>View Details</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No service requests found for this client.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Contact Inquiries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Inquiries ({contactRequests.length})
              </CardTitle>
              <CardDescription>
                Inquiries from the contact form
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contactRequests.length > 0 ? (
                <div className="space-y-4">
                  {contactRequests.map((request: any) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-foreground">{request.title}</h4>
                          <p className="text-sm text-muted-foreground">{request.service_category}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getSourceColor(request.request_source)}>
                            Contact Inquiry
                          </Badge>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Created: {new Date(request.created_at).toLocaleDateString()}
                        </span>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/admin/requests/${request.id}`}>View Details</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No contact inquiries found for this client.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment History ({client.payments?.length || 0})
              </CardTitle>
              <CardDescription>
                Payment transactions for this client
              </CardDescription>
            </CardHeader>
            <CardContent>
              {client.payments && client.payments.length > 0 ? (
                <div className="space-y-4">
                  {client.payments.map((payment: any) => (
                    <div key={payment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-medium">
                            {payment.currency} {payment.amount.toFixed(2)}
                          </span>
                        </div>
                        <Badge className={getPaymentStatusColor(payment.payment_status)}>
                          {payment.payment_status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No payments found for this client.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}