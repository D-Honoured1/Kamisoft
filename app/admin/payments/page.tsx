// app/admin/payments/page.tsx
export const dynamic = "force-dynamic";

import { requireAuth } from "@/lib/auth/server-auth"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CreditCard, DollarSign, Calendar, FileText } from "lucide-react"

export default async function PaymentsPage() {
  // Require authentication
  await requireAuth()
  
  const supabase = createServerClient()

  const { data: payments, error } = await supabase
    .from("payments")
    .select(`
      *,
      service_request:request_id (
        id,
        title,
        clients (
          name,
          email
        )
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching payments:", error)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "refunded":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const totalRevenue = payments?.reduce((sum, payment) => {
    if (payment.payment_status === 'completed') {
      return sum + (payment.amount || 0)
    }
    return sum
  }, 0) || 0

  const pendingAmount = payments?.reduce((sum, payment) => {
    if (payment.payment_status === 'pending' || payment.payment_status === 'processing') {
      return sum + (payment.amount || 0)
    }
    return sum
  }, 0) || 0

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payment Management</h1>
          <p className="text-muted-foreground mt-2">Track and manage all payment transactions</p>
        </div>
      </div>

      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-full bg-green-50 dark:bg-green-950">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
                <p className="text-2xl font-bold text-yellow-600">${pendingAmount.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-50 dark:bg-yellow-950">
                <CreditCard className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold text-blue-600">{payments?.length || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-950">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments List */}
      {payments && payments.length > 0 ? (
        <div className="space-y-4">
          {payments.map((payment: any) => (
            <Card key={payment.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-foreground">
                        {payment.service_request?.title || 'Service Request'}
                      </h4>
                      <Badge className={getStatusColor(payment.payment_status)}>
                        {payment.payment_status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div>
                        <strong>Client:</strong> {payment.service_request?.clients?.name || 'N/A'}
                      </div>
                      <div>
                        <strong>Amount:</strong> {payment.currency} ${payment.amount}
                      </div>
                      <div>
                        <strong>Method:</strong> {payment.payment_method?.replace('_', ' ') || 'N/A'}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(payment.created_at).toLocaleDateString()} at {new Date(payment.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                    {payment.payment_status === 'pending' && (
                      <Button size="sm">
                        Process Payment
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No payments yet</h3>
            <p className="text-muted-foreground">Payment transactions will appear here as they are processed.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}