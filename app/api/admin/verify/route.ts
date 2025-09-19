// app/api/admin/verify/route.ts - Add this new file for auth verification

import { NextResponse } from "next/server"
import { getAdminUser } from "@/lib/auth/server-auth"

export async function GET() {
  try {
    const user = await getAdminUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json(
      { error: "Authentication verification failed" },
      { status: 500 }
    )
  }
}

export default async function ServiceRequestDetail({ params }: { params: { id: string } }) {
  // Require authentication
  await requireAuth()
  
  const supabase = createServerClient()

  const { data: request, error } = await supabase
    .from("service_requests")
    .select(`
      *,
      clients (
        name,
        email,
        phone,
        company
      ),
      payments (
        id,
        amount,
        payment_status,
        payment_method,
        created_at
      )
    `)
    .eq("id", params.id)
    .single()

  if (error || !request) {
    notFound()
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

  const hasUnpaidAmount = request.estimated_cost && (!request.payments || 
    request.payments.filter((p: any) => p.payment_status === 'completed').length === 0)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Service Request Details</h1>
          <p className="text-muted-foreground mt-2">Request #{request.id.slice(0, 8)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/requests">Back to Requests</Link>
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
                  <CardTitle className="text-xl">{request.title || request.service_type}</CardTitle>
                  <CardDescription className="mt-1">
                    Submitted on {new Date(request.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {request.priority && (
                    <Badge className={getPriorityColor(request.priority)}>{request.priority} priority</Badge>
                  )}
                  <Badge className={getStatusColor(request.status)}>{request.status.replace("_", " ")}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Description</h4>
                  <p className="text-muted-foreground">{request.description}</p>
                </div>

                {request.service_location === "on_site" && request.address && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Service Address</h4>
                    <p className="text-muted-foreground flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-1" />
                      {request.address}
                    </p>
                  </div>
                )}

                {request.preferred_date && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Preferred Date</h4>
                    <p className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(request.preferred_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">{request.clients?.name}</p>
                    {request.clients?.company && (
                      <p className="text-sm text-muted-foreground">{request.clients.company}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="text-muted-foreground">{request.clients?.email}</p>
                </div>
                {request.clients?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className="text-muted-foreground">{request.clients.phone}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {request.estimated_cost && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Estimated Cost</p>
                      <p className="text-muted-foreground">${request.estimated_cost.toLocaleString()}</p>
                    </div>
                  </div>
                )}

                {request.payments && request.payments.length > 0 ? (
                  <div>
                    <p className="font-medium text-foreground mb-2">Payment History</p>
                    {request.payments.map((payment: any) => (
                      <div key={payment.id} className="flex items-center justify-between p-2 border rounded mb-2">
                        <div>
                          <p className="text-sm font-medium">${payment.amount.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{payment.payment_method}</p>
                        </div>
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
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No payments recorded yet</p>
                )}

                {/* Payment Action Button */}
                {hasUnpaidAmount && (
                  <div className="pt-4 border-t">
                    <PaymentButton 
                      requestId={request.id}
                      amount={request.estimated_cost}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button className="w-full" variant="outline" asChild>
                  <Link href={`mailto:${request.clients?.email}?subject=Re: ${request.title || request.service_type}`}>
                    Contact Client
                  </Link>
                </Button>
                <Button className="w-full" variant="outline" asChild>
                  <Link href={`/admin/requests/${request.id}/edit`}>Update Status</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}