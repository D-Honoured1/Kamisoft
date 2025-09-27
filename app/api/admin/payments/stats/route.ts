// app/api/admin/payments/stats/route.ts - Payment Statistics API - FIXED
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getAdminUser } from "@/lib/auth/server-auth"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET() {
  try {
    // Check admin authentication
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Fetching payment statistics...")

    // Get all payments with basic info
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from("payments")
      .select(`
        id,
        amount,
        payment_status,
        payment_method,
        payment_type,
        created_at,
        updated_at
      `)
      .order("created_at", { ascending: false })

    if (paymentsError) {
      console.error("Error fetching payments for stats:", paymentsError)
      return NextResponse.json({ error: "Failed to fetch payment statistics" }, { status: 500 })
    }

    // Calculate statistics
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    const stats = {
      totalPayments: payments?.length || 0,
      totalRevenue: 0,
      pendingAmount: 0,
      confirmedPayments: 0,
      failedPayments: 0,
      cancelledPayments: 0,
      todayPayments: 0,
      todayRevenue: 0,
      conversionRate: 0,
      avgPaymentAmount: 0,
      paymentMethods: {
        paystack: 0,
        bank_transfer: 0,
        crypto: 0,
        other: 0
      },
      paymentTypes: {
        split: 0,
        full: 0
      },
      monthlyTrend: [] as Array<{
        month: string,
        revenue: number,
        count: number
      }>
    }

    if (payments && payments.length > 0) {
      // Calculate basic stats
      payments.forEach(payment => {
        const amount = payment.amount || 0
        const createdAt = new Date(payment.created_at)
        const isToday = createdAt >= todayStart

        // Payment status counts
        switch (payment.payment_status) {
          case "paid":
          case "confirmed":
          case "completed":
            stats.totalRevenue += amount
            stats.confirmedPayments++
            if (isToday) {
              stats.todayRevenue += amount
              stats.todayPayments++
            }
            break
          case "pending":
          case "processing":
            stats.pendingAmount += amount
            break
          case "failed":
          case "declined":
            stats.failedPayments++
            break
          case "cancelled":
          case "expired":
            stats.cancelledPayments++
            break
        }

        // Payment method counts
        switch (payment.payment_method) {
          case "paystack":
            stats.paymentMethods.paystack++
            break
          case "bank_transfer":
            stats.paymentMethods.bank_transfer++
            break
          case "crypto":
            stats.paymentMethods.crypto++
            break
          default:
            stats.paymentMethods.other++
        }

        // Payment type counts
        switch (payment.payment_type) {
          case "split":
            stats.paymentTypes.split++
            break
          case "full":
            stats.paymentTypes.full++
            break
        }
      })

      // Calculate derived stats
      stats.conversionRate = stats.totalPayments > 0 
        ? (stats.confirmedPayments / stats.totalPayments) * 100 
        : 0

      stats.avgPaymentAmount = stats.confirmedPayments > 0 
        ? stats.totalRevenue / stats.confirmedPayments 
        : 0

      // Generate monthly trend (last 6 months)
      const monthlyData: { [key: string]: { revenue: number; count: number } } = {}
      
      // Initialize last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthKey = date.toISOString().substring(0, 7) // YYYY-MM format
        monthlyData[monthKey] = { revenue: 0, count: 0 }
      }

      // Populate with actual data
      payments.forEach(payment => {
        if (payment.payment_status === "paid" || payment.payment_status === "confirmed") {
          const monthKey = payment.created_at.substring(0, 7)
          if (monthlyData[monthKey]) {
            monthlyData[monthKey].revenue += payment.amount || 0
            monthlyData[monthKey].count += 1
          }
        }
      })

      // Convert to array format
      stats.monthlyTrend = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        revenue: data.revenue,
        count: data.count
      }))
    }

    console.log("Payment statistics calculated:", {
      totalPayments: stats.totalPayments,
      totalRevenue: stats.totalRevenue,
      pendingAmount: stats.pendingAmount
    })

    return NextResponse.json({
      success: true,
      statistics: stats,
      lastUpdated: new Date().toISOString()
    })
  } catch (error: any) {
    console.error("Payment statistics error:", error)
    return NextResponse.json({
      error: "Failed to generate payment statistics",
      details: error.message
    }, { status: 500 })
  }
}