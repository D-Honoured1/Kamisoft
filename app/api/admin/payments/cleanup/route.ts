// app/api/admin/payments/cleanup/route.ts - Payment Cleanup System
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

// Configuration
const PAYMENT_EXPIRY_HOURS = 24 // Payments expire after 24 hours
const PAYMENT_LINK_EXPIRY_HOURS = 1 // Payment links expire after 1 hour

export async function POST() {
  try {
    // Check admin authentication
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }


    const results = {
      expiredPayments: 0,
      expiredPaymentLinks: 0,
      cleanupTime: new Date().toISOString()
    }

    // Step 1: Mark expired pending payments as cancelled
    const paymentExpiryTime = new Date()
    paymentExpiryTime.setHours(paymentExpiryTime.getHours() - PAYMENT_EXPIRY_HOURS)

    const { data: expiredPayments, error: paymentsError } = await supabaseAdmin
      .from("payments")
      .select("id, request_id")
      .eq("payment_status", "pending")
      .lt("created_at", paymentExpiryTime.toISOString())

    if (paymentsError) {
    } else if (expiredPayments && expiredPayments.length > 0) {

      // Update expired payments to cancelled
      const { error: updateError } = await supabaseAdmin
        .from("payments")
        .update({
          payment_status: "cancelled",
          admin_notes: `Automatically cancelled after ${PAYMENT_EXPIRY_HOURS} hours of inactivity`,
          updated_at: new Date().toISOString()
        })
        .in("id", expiredPayments.map(p => p.id))

      if (updateError) {
      } else {
        results.expiredPayments = expiredPayments.length
      }
    }

    // Step 2: Clear expired payment links from service requests
    const linkExpiryTime = new Date()
    linkExpiryTime.setHours(linkExpiryTime.getHours() - PAYMENT_LINK_EXPIRY_HOURS)

    const { data: expiredLinks, error: linksError } = await supabaseAdmin
      .from("service_requests")
      .select("id")
      .not("payment_link_expiry", "is", null)
      .lt("payment_link_expiry", linkExpiryTime.toISOString())

    if (linksError) {
    } else if (expiredLinks && expiredLinks.length > 0) {

      // Clear expired payment links
      const { error: clearLinksError } = await supabaseAdmin
        .from("service_requests")
        .update({
          payment_link_expiry: null,
          updated_at: new Date().toISOString()
        })
        .in("id", expiredLinks.map(r => r.id))

      if (clearLinksError) {
      } else {
        results.expiredPaymentLinks = expiredLinks.length
      }
    }


    return NextResponse.json({
      success: true,
      message: "Payment cleanup completed successfully",
      results
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Payment cleanup failed" },
      { status: 500 }
    )
  }
}

// GET endpoint for manual cleanup trigger
export async function GET() {
  try {
    // Check admin authentication
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get cleanup statistics without performing cleanup
    const paymentExpiryTime = new Date()
    paymentExpiryTime.setHours(paymentExpiryTime.getHours() - PAYMENT_EXPIRY_HOURS)

    const linkExpiryTime = new Date()
    linkExpiryTime.setHours(linkExpiryTime.getHours() - PAYMENT_LINK_EXPIRY_HOURS)

    const [expiredPaymentsResult, expiredLinksResult] = await Promise.all([
      supabaseAdmin
        .from("payments")
        .select("id", { count: "exact" })
        .eq("payment_status", "pending")
        .lt("created_at", paymentExpiryTime.toISOString()),
      
      supabaseAdmin
        .from("service_requests")
        .select("id", { count: "exact" })
        .not("payment_link_expiry", "is", null)
        .lt("payment_link_expiry", linkExpiryTime.toISOString())
    ])

    return NextResponse.json({
      success: true,
      statistics: {
        expiredPendingPayments: expiredPaymentsResult.count || 0,
        expiredPaymentLinks: expiredLinksResult.count || 0,
        paymentExpiryHours: PAYMENT_EXPIRY_HOURS,
        linkExpiryHours: PAYMENT_LINK_EXPIRY_HOURS,
        lastChecked: new Date().toISOString()
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get cleanup statistics" },
      { status: 500 }
    )
  }
}