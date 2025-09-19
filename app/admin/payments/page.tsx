// app/admin/payments/page.tsx
export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSign, CreditCard, Calendar, User, ArrowRight } from "lucide-react"
import Link from "next/link"

export default async function PaymentsPage() {
  // Require authentication
  const adminUser = await requireAuth()
  
  const supabase = createServerClient()

  const { data: payments, error } = await supabase
    .from("payments")
    .select(`
      *,
      service_requests (
        id,
        title,
        clients (
          id,
          name,
          email
        )
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching payments:", error)
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "refunded":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const totalRevenue = payments?.reduce((sum, payment: any) => {
    return payment.payment_status === 'paid' ? sum + payment.amount : sum
  }, 0) || 0

  const pendingAmount = payments?.reduce((sum, payment: any) => {
    return payment.payment_status === 'pending' ? sum + payment.amount : sum
  }, 0) || 0

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payment Management</h1>
          <p className="text-muted-foreground mt-2">Track and manage all client payments</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
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
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Payments</p>
                <p className="text-2xl font-bold text-foreground">{payments?.length || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments List */}
      {payments && payments.length > 0 ? (
        <div className="space-y-4">
          {payments.map((payment: any) => (
            <Card key={payment.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">
                        {payment.currency} {payment.amount.toFixed(2)}
                      </span>
                      <Badge className={getPaymentStatusColor(payment.payment_status)}>
                        {payment.payment_status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {payment.service_requests?.clients?.name || 'Unknown Client'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(payment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-2">
                      Payment Method: {payment.payment_method || 'N/A'}
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/payments/${payment.id}`}>
                        View Details <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>

                {payment.service_requests?.title && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Related Service Request:</p>
                    <Link 
                      href={`/admin/requests/${payment.service_requests.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {payment.service_requests.title}
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No payments yet</h3>
            <p className="text-muted-foreground">Payment records will appear here as transactions are processed.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}