// app/admin/payments/manage/page.tsx - Enhanced Payment Management with Clear and Approve buttons
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { 
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  CreditCard,
  Building,
  Wallet,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  DollarSign
} from "lucide-react"
import { DashboardHomeButton } from "@/components/admin-navigation/dashboard-home-button"
import { useToast } from "@/components/ui/use-toast"

interface Payment {
  id: string
  amount: number
  currency: string
  payment_method: string
  payment_status: string
  payment_type?: string
  created_at: string
  confirmed_at?: string
  error_message?: string
  admin_notes?: string
  paystack_reference?: string
  stripe_payment_intent_id?: string
  service_requests: {
    id: string
    title: string
    clients: {
      name: string
      email: string
    }
  }
}

export default function AdminPaymentManager() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("all")
  const [methodFilter, setMethodFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchPayments()
  }, [])

  useEffect(() => {
    filterPayments()
  }, [payments, statusFilter, methodFilter, searchTerm])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/payments/all')
      
      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments || [])
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast({
        title: "Error",
        description: "Failed to fetch payments",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filterPayments = () => {
    let filtered = [...payments]

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(p => p.payment_status === statusFilter)
    }

    // Method filter
    if (methodFilter !== "all") {
      filtered = filtered.filter(p => p.payment_method === methodFilter)
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p => 
        p.service_requests.title.toLowerCase().includes(term) ||
        p.service_requests.clients.name.toLowerCase().includes(term) ||
        p.service_requests.clients.email.toLowerCase().includes(term) ||
        p.id.toLowerCase().includes(term) ||
        (p.paystack_reference && p.paystack_reference.toLowerCase().includes(term)) ||
        (p.stripe_payment_intent_id && p.stripe_payment_intent_id.toLowerCase().includes(term))
      )
    }

    setFilteredPayments(filtered)
  }

  // Clear failed payment
  const clearFailedPayment = async (paymentId: string) => {
    try {
      setProcessing(true)
      const response = await fetch(`/api/admin/payments/${paymentId}/delete`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchPayments()
        toast({
          title: "Success",
          description: "Failed payment cleared successfully",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to clear payment')
      }
    } catch (error: any) {
      console.error('Error clearing payment:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to clear payment",
        variant: "destructive"
      })
    } finally {
      setProcessing(false)
    }
  }

  // Approve successful payment
  const approvePayment = async (paymentId: string, notes: string = "") => {
    try {
      setProcessing(true)
      const response = await fetch(`/api/admin/payments/${paymentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_status: 'confirmed',
          admin_notes: notes || `Payment approved by admin`,
          confirmed_at: new Date().toISOString(),
          confirmed_by: 'admin_approval'
        })
      })

      if (response.ok) {
        await fetchPayments()
        setSelectedPayment(null)
        setAdminNotes("")
        toast({
          title: "Success",
          description: "Payment approved successfully",
        })
      } else {
        throw new Error('Failed to approve payment')
      }
    } catch (error: any) {
      console.error('Error approving payment:', error)
      toast({
        title: "Error",
        description: "Failed to approve payment",
        variant: "destructive"
      })
    } finally {
      setProcessing(false)
    }
  }

  // Decline payment
  const declinePayment = async (paymentId: string, notes: string = "") => {
    try {
      setProcessing(true)
      const response = await fetch(`/api/admin/payments/${paymentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_status: 'declined',
          admin_notes: notes || `Payment declined by admin`,
          updated_at: new Date().toISOString()
        })
      })

      if (response.ok) {
        await fetchPayments()
        setSelectedPayment(null)
        setAdminNotes("")
        toast({
          title: "Success",
          description: "Payment declined",
        })
      } else {
        throw new Error('Failed to decline payment')
      }
    } catch (error: any) {
      console.error('Error declining payment:', error)
      toast({
        title: "Error",
        description: "Failed to decline payment",
        variant: "destructive"
      })
    } finally {
      setProcessing(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending':
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'failed':
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'paid':
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case 'pending':
      case 'processing':
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case 'failed':
      case 'declined':
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'stripe':
        return <CreditCard className="h-4 w-4" />
      case 'paystack':
        return <Wallet className="h-4 w-4" />
      case 'bank_transfer':
        return <Building className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const stats = {
    total: payments.length,
    confirmed: payments.filter(p => p.payment_status === 'confirmed' || p.payment_status === 'paid').length,
    pending: payments.filter(p => p.payment_status === 'pending' || p.payment_status === 'processing').length,
    failed: payments.filter(p => p.payment_status === 'failed' || p.payment_status === 'declined').length,
    totalRevenue: payments
      .filter(p => p.payment_status === 'confirmed' || p.payment_status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <DashboardHomeButton />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardHomeButton />
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payment Management</h1>
          <p className="text-muted-foreground mt-2">Review and manage all payment transactions</p>
        </div>
        <Button onClick={fetchPayments} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Payments</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-primary">${stats.totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Payment Method</Label>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="paystack">Paystack</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <div className="space-y-4">
        {filteredPayments.length > 0 ? (
          filteredPayments.map((payment) => (
            <Card key={payment.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getMethodIcon(payment.payment_method)}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-lg">
                          ${payment.amount.toFixed(2)} {payment.currency}
                        </span>
                        <Badge className={getStatusColor(payment.payment_status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(payment.payment_status)}
                            {payment.payment_status}
                          </span>
                        </Badge>
                        {payment.payment_type && (
                          <Badge variant="outline">
                            {payment.payment_type === 'split' ? 'Split' : 'Full'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {payment.service_requests.clients.name} • {payment.service_requests.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payment.created_at).toLocaleString()} • 
                        {payment.paystack_reference && ` Paystack: ${payment.paystack_reference}`}
                        {payment.stripe_payment_intent_id && ` Stripe: ${payment.stripe_payment_intent_id}`}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {/* Clear Failed Payment Button */}
                    {(payment.payment_status === 'failed' || payment.payment_status === 'declined') && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={processing}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Clear Failed Payment?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this failed payment record from the system. 
                              This action cannot be undone.
                              <div className="mt-2 p-3 bg-red-50 rounded-lg">
                                <p className="text-sm font-medium">Payment Details:</p>
                                <p className="text-sm text-red-800">
                                  ${payment.amount} • {payment.payment_method} • {payment.payment_status}
                                </p>
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => clearFailedPayment(payment.id)}
                              disabled={processing}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {processing ? "Clearing..." : "Clear Payment"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    {/* Approve Successful Payment */}
                    {(payment.payment_status === 'pending' || payment.payment_status === 'processing') && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => approvePayment(payment.id, `Payment approved via admin dashboard on ${new Date().toLocaleString()}`)}
                          disabled={processing}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Approve
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={processing}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="mr-1 h-4 w-4" />
                              Decline
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Decline Payment?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to decline this payment? This will mark it as declined
                                and the client may need to retry the payment.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => declinePayment(payment.id, "Payment declined by admin")}
                                disabled={processing}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Decline Payment
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}

                    {/* View Details */}
                    <Button size="sm" variant="outline" asChild>
                      <a href={`/admin/requests/${payment.service_requests.id}`}>
                        <Eye className="mr-1 h-4 w-4" />
                        View
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Error Message */}
                {payment.error_message && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Error:</strong> {payment.error_message}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Admin Notes */}
                {payment.admin_notes && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-1">Admin Notes:</p>
                    <p className="text-sm">{payment.admin_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No payments match your filters</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}