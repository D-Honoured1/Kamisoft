// app/admin/payments/manage/page.tsx - Admin Payment Management Interface
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
  Edit
} from "lucide-react"
import { DashboardHomeButton } from "@/components/admin-navigation/dashboard-home-button"

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
        p.id.toLowerCase().includes(term)
      )
    }

    setFilteredPayments(filtered)
  }

  const updatePaymentStatus = async (paymentId: string, status: string) => {
    try {
      setProcessing(true)
      const response = await fetch(`/api/admin/payments/${paymentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_status: status,
          admin_notes: adminNotes || `Payment ${status} by admin`,
          confirmed_at: status === 'confirmed' ? new Date().toISOString() : undefined
        })
      })

      if (response.ok) {
        await fetchPayments()
        setSelectedPayment(null)
        setAdminNotes("")
      } else {
        throw new Error('Failed to update payment')
      }
    } catch (error) {
      console.error('Error updating payment:', error)
      alert('Failed to update payment status')
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
    pending: payments.filter(p => p.payment_status === 'pending').length,
    failed: payments.filter(p => p.payment_status === 'failed' || p.payment_status === 'declined').length,
    totalRevenue: payments
      .filter(p => p.payment_status === 'confirmed' || p.payment_status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0)
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
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
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
              <div className="text-2xl">💰</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters & Payment List */}
        <div className="lg:col-span-2">
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

          {/* Payment List */}
          <Card>
            <CardHeader>
              <CardTitle>Payments ({filteredPayments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2">Loading payments...</p>
                </div>
              ) : filteredPayments.length > 0 ? (
                <div className="space-y-4">
                  {filteredPayments.map((payment) => (
                    <div 
                      key={payment.id} 
                      className={`border rounded-lg p-4 cursor-pointer hover:bg-accent/50 ${
                        selectedPayment?.id === payment.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedPayment(payment)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {getMethodIcon(payment.payment_method)}
                          <div>
                            <p className="font-semibold">${payment.amount.toFixed(2)} {payment.currency}</p>
                            <p className="text-sm text-muted-foreground">
                              {payment.service_requests.clients.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {payment.payment_type && (
                            <Badge variant="outline">
                              {payment.payment_type === 'split' ? 'Split' : 'Full'}
                            </Badge>
                          )}
                          <Badge className={getStatusColor(payment.payment_status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(payment.payment_status)}
                              {payment.payment_status}
                            </span>
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <p>{payment.service_requests.title}</p>
                        <p>Created: {new Date(payment.created_at).toLocaleString()}</p>
                        {payment.error_message && (
                          <p className="text-red-600 mt-1">Error: {payment.error_message}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p>No payments match your filters</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment Details & Actions */}
        <div>
          {selectedPayment ? (
            <Card>
              <CardHeader>
                <CardTitle>Payment Actions</CardTitle>
                <CardDescription>
                  Manage payment: {selectedPayment.id.slice(0, 8)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-semibold">${selectedPayment.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge className={getStatusColor(selectedPayment.payment_status)}>
                      {selectedPayment.payment_status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Method:</span>
                    <span className="capitalize">{selectedPayment.payment_method.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Client:</span>
                    <span>{selectedPayment.service_requests.clients.name}</span>
                  </div>
                </div>

                {selectedPayment.admin_notes && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Previous Notes:</p>
                    <p className="text-sm">{selectedPayment.admin_notes}</p>
                  </div>
                )}

                {(selectedPayment.payment_status === 'pending' || selectedPayment.payment_status === 'processing') && (
                  <div className="space-y-4">
                    <div>
                      <Label>Admin Notes</Label>
                      <Textarea
                        placeholder="Add notes about this payment..."
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Button
                        onClick={() => updatePaymentStatus(selectedPayment.id, 'confirmed')}
                        disabled={processing}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {processing ? 'Processing...' : 'Confirm Payment'}
                      </Button>

                      <Button
                        onClick={() => updatePaymentStatus(selectedPayment.id, 'declined')}
                        disabled={processing}
                        variant="outline"
                        className="w-full border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Decline Payment
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-4 border-t">
                  <Button variant="outline" className="w-full" asChild>
                    <a href={`/admin/requests/${selectedPayment.service_requests.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Service Request
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a payment to manage</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}