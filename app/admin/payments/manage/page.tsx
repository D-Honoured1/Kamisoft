// app/admin/payments/manage/page.tsx - Enhanced Payment Management with Clear and Approve buttons
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  Trash2,
  DollarSign,
  Ban
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
  crypto_address?: string
  crypto_network?: string
  crypto_amount?: number
  crypto_symbol?: string
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
      } else {
        throw new Error('Failed to fetch payments')
      }
    } catch (error) {
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
        (p.paystack_reference && p.paystack_reference.toLowerCase().includes(term))
      )
    }

    setFilteredPayments(filtered)
  }

  // Clear failed payment using the correct delete endpoint
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
      toast({
        title: "Error",
        description: error.message || "Failed to clear payment",
        variant: "destructive"
      })
    } finally {
      setProcessing(false)
    }
  }

  // Approve successful payment using the correct approve endpoint
  const approvePayment = async (paymentId: string) => {
    try {
      setProcessing(true)
      const response = await fetch(`/api/admin/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentStatus: 'success', // or 'completed'
          paystackReference: payments.find(p => p.id === paymentId)?.paystack_reference
        })
      })

      if (response.ok) {
        await fetchPayments()
        toast({
          title: "Success",
          description: "Payment approved successfully",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to approve payment')
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve payment",
        variant: "destructive"
      })
    } finally {
      setProcessing(false)
    }
  }

  // Delete crypto payment (same as clearFailedPayment but for crypto)
  const deleteCryptoPayment = async (paymentId: string) => {
    try {
      setProcessing(true)
      const response = await fetch(`/api/admin/payments/${paymentId}/delete`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchPayments()
        toast({
          title: "Success",
          description: "Crypto payment deleted successfully",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete payment')
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete payment",
        variant: "destructive"
      })
    } finally {
      setProcessing(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'success':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case 'pending':
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'failed':
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'cancelled':
        return <Ban className="h-4 w-4 text-gray-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case 'success':
      case 'completed':
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case 'pending':
      case 'processing':
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case 'failed':
      case 'declined':
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case 'cancelled':
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'paystack':
        return <Wallet className="h-4 w-4" />
      case 'bank_transfer':
        return <Building className="h-4 w-4" />
      case 'crypto':
        return <CreditCard className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const stats = {
    total: payments.length,
    confirmed: payments.filter(p => p.payment_status === 'confirmed').length,
    pending: payments.filter(p => ['pending', 'processing', 'success', 'completed'].includes(p.payment_status)).length,
    failed: payments.filter(p => ['failed', 'declined'].includes(p.payment_status)).length,
    cancelled: payments.filter(p => p.payment_status === 'cancelled').length,
    totalRevenue: payments
      .filter(p => p.payment_status === 'confirmed')
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
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
                <p className="text-sm font-medium text-muted-foreground">Cancelled</p>
                <p className="text-2xl font-bold text-gray-600">{stats.cancelled}</p>
              </div>
              <Ban className="h-8 w-8 text-gray-600" />
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
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
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
                  <SelectItem value="paystack">Paystack</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
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
            <Card key={payment.id} className="">
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
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {/* Clear Failed Payment Button */}
                    {(['failed', 'declined'].includes(payment.payment_status)) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={processing}
                          >
                            <Trash2 className="h-4 w-4" />
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
                    {(['success', 'completed'].includes(payment.payment_status)) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            disabled={processing}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Approve
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Approve Payment?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will confirm the payment as valid and may update the service request status.
                              <div className="mt-2 p-3 bg-green-50 rounded-lg">
                                <p className="text-sm font-medium">Payment Details:</p>
                                <p className="text-sm text-green-800">
                                  ${payment.amount} • {payment.payment_method} • {payment.payment_status}
                                </p>
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => approvePayment(payment.id)}
                              disabled={processing}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {processing ? "Approving..." : "Approve Payment"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    {/* Delete Crypto Payment */}
                    {(payment.payment_method === 'crypto' && ['failed', 'cancelled', 'pending', 'processing'].includes(payment.payment_status)) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={processing}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Crypto Payment?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this crypto payment record from the system.
                              This action cannot be undone.
                              <div className="mt-2 p-3 bg-red-50 rounded-lg">
                                <p className="text-sm font-medium">Payment Details:</p>
                                <p className="text-sm text-red-800">
                                  ${payment.amount} • {payment.crypto_amount} {payment.crypto_symbol} • {payment.payment_status}
                                </p>
                                {payment.crypto_address && (
                                  <p className="text-xs text-red-700 mt-1">
                                    Address: {payment.crypto_address.substring(0, 20)}...
                                  </p>
                                )}
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteCryptoPayment(payment.id)}
                              disabled={processing}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {processing ? "Deleting..." : "Delete Payment"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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