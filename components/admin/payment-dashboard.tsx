// components/admin/payment-dashboard.tsx - Enhanced Payment Dashboard
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  RefreshCw, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  TrendingUp,
  Settings,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  Calendar
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface PaymentStats {
  totalPayments: number
  totalRevenue: number
  pendingAmount: number
  expiredPayments: number
  todayPayments: number
  conversionRate: number
}

interface CleanupStats {
  expiredPendingPayments: number
  expiredPaymentLinks: number
  paymentExpiryHours: number
  linkExpiryHours: number
  lastChecked: string
}

export function PaymentDashboard() {
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [cleanupStats, setCleanupStats] = useState<CleanupStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [cleanupLoading, setCleanupLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadDashboardData()
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      const [statsResponse, cleanupResponse] = await Promise.all([
        fetch('/api/admin/payments/stats'),
        fetch('/api/admin/payments/cleanup')
      ])

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      if (cleanupResponse.ok) {
        const cleanupData = await cleanupResponse.json()
        setCleanupStats(cleanupData.statistics)
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const runCleanup = async () => {
    setCleanupLoading(true)
    try {
      const response = await fetch('/api/admin/payments/cleanup', {
        method: 'POST'
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Cleanup Complete",
          description: `Cleaned ${result.results.expiredPayments} payments and ${result.results.expiredPaymentLinks} links`,
        })
        
        // Refresh data
        await loadDashboardData()
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      toast({
        title: "Cleanup Failed",
        description: error.message || "Failed to run cleanup",
        variant: "destructive"
      })
    } finally {
      setCleanupLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payment Dashboard</h2>
          <p className="text-muted-foreground">Monitor and manage all payment activities</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadDashboardData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={runCleanup} disabled={cleanupLoading} size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            {cleanupLoading ? "Cleaning..." : "Run Cleanup"}
          </Button>
        </div>
      </div>

      {/* Payment Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                From {stats.totalPayments} confirmed payments
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Amount</p>
                  <p className="text-2xl font-bold text-yellow-600">${stats.pendingAmount.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Awaiting confirmation
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Today's Payments</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.todayPayments}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {stats.conversionRate.toFixed(1)}% conversion rate
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cleanup Status */}
      {cleanupStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Automatic Cleanup Status
            </CardTitle>
            <CardDescription>
              Automatic cleanup removes expired payments and links to keep the system clean
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{cleanupStats.expiredPendingPayments}</p>
                <p className="text-sm text-red-700 dark:text-red-300">Expired Pending Payments</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Older than {cleanupStats.paymentExpiryHours}h
                </p>
              </div>
              
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{cleanupStats.expiredPaymentLinks}</p>
                <p className="text-sm text-orange-700 dark:text-orange-300">Expired Payment Links</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Older than {cleanupStats.linkExpiryHours}h
                </p>
              </div>

              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <p className="text-lg font-bold text-blue-600">
                  {cleanupStats.paymentExpiryHours}h
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">Payment Timeout</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-cancel after this time
                </p>
              </div>

              <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <p className="text-lg font-bold text-green-600">
                  {cleanupStats.linkExpiryHours}h
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">Link Expiry</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Security timeout
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Last checked: {new Date(cleanupStats.lastChecked).toLocaleString()}</span>
              </div>
              
              {(cleanupStats.expiredPendingPayments > 0 || cleanupStats.expiredPaymentLinks > 0) && (
                <Badge variant="destructive" className="animate-pulse">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Cleanup needed
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      <div className="space-y-4">
        {cleanupStats && cleanupStats.expiredPendingPayments > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>{cleanupStats.expiredPendingPayments} pending payments</strong> have expired and should be cleaned up. 
              These payments have been pending for more than {cleanupStats.paymentExpiryHours} hours.
            </AlertDescription>
          </Alert>
        )}

        {cleanupStats && cleanupStats.expiredPaymentLinks > 0 && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>{cleanupStats.expiredPaymentLinks} payment links</strong> have expired and can be cleared. 
              These links expired more than {cleanupStats.linkExpiryHours} hour(s) ago.
            </AlertDescription>
          </Alert>
        )}

        {stats && stats.pendingAmount > 0 && (
          <Alert>
            <DollarSign className="h-4 w-4" />
            <AlertDescription>
              <strong>${stats.pendingAmount.toFixed(2)} in pending payments</strong> requires your attention. 
              Review and confirm legitimate payments to maintain cash flow.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common payment management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2" asChild>
              <a href="/admin/payments">
                <Eye className="h-5 w-5" />
                <span>View All Payments</span>
              </a>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>Confirm Payments</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={runCleanup}
              disabled={cleanupLoading}
            >
              <Trash2 className="h-5 w-5" />
              <span>{cleanupLoading ? "Cleaning..." : "Run Cleanup"}</span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2" asChild>
              <a href="/admin/requests">
                <Settings className="h-5 w-5" />
                <span>Manage Requests</span>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}