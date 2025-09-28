// app/api/cron/cleanup-payments/route.ts - Automated Payment Cleanup (for Vercel Cron)
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

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

export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'development'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log("🧹 Starting automated payment cleanup...")

    const results = {
      timestamp: new Date().toISOString(),
      expiredPayments: 0,
      expiredPaymentLinks: 0,
      errors: [] as string[]
    }

    // Step 1: Handle expired pending payments
    try {
      const paymentExpiryTime = new Date()
      paymentExpiryTime.setHours(paymentExpiryTime.getHours() - PAYMENT_EXPIRY_HOURS)

      // Find expired pending payments
      const { data: expiredPayments, error: findError } = await supabaseAdmin
        .from("payments")
        .select(`
          id, 
          request_id, 
          amount, 
          payment_method,
          service_requests (
            id,
            title,
            clients (
              name,
              email
            )
          )
        `)
        .eq("payment_status", "pending")
        .lt("created_at", paymentExpiryTime.toISOString())

      if (findError) {
        throw new Error(`Finding expired payments: ${findError.message}`)
      }

      if (expiredPayments && expiredPayments.length > 0) {
        console.log(`📋 Found ${expiredPayments.length} expired pending payments`)

        // Update payments to cancelled status
        const { error: updateError } = await supabaseAdmin
          .from("payments")
          .update({
            payment_status: "cancelled",
            admin_notes: `Auto-cancelled after ${PAYMENT_EXPIRY_HOURS}h timeout at ${new Date().toISOString()}`,
            updated_at: new Date().toISOString()
          })
          .in("id", expiredPayments.map(p => p.id))

        if (updateError) {
          throw new Error(`Updating expired payments: ${updateError.message}`)
        }

        results.expiredPayments = expiredPayments.length
        console.log(`✅ Cancelled ${expiredPayments.length} expired payments`)

        // Optional: Send notification emails to clients about expired payments
        for (const payment of expiredPayments) {
          try {
            await sendPaymentExpiredNotification(payment)
          } catch (emailError) {
            console.error("Failed to send expiry notification:", emailError)
            // Don't fail the entire process for email errors
          }
        }
      }
    } catch (error: any) {
      console.error("❌ Error handling expired payments:", error)
      results.errors.push(`Payment cleanup: ${error.message}`)
    }

    // Step 2: Clean up expired payment links
    try {
      const linkExpiryTime = new Date()
      linkExpiryTime.setHours(linkExpiryTime.getHours() - PAYMENT_LINK_EXPIRY_HOURS)

      // Find service requests with expired payment links
      const { data: expiredLinks, error: findLinksError } = await supabaseAdmin
        .from("service_requests")
        .select("id, title, payment_link_expiry")
        .not("payment_link_expiry", "is", null)
        .lt("payment_link_expiry", linkExpiryTime.toISOString())

      if (findLinksError) {
        throw new Error(`Finding expired links: ${findLinksError.message}`)
      }

      if (expiredLinks && expiredLinks.length > 0) {
        console.log(`🔗 Found ${expiredLinks.length} expired payment links`)

        // Clear the expired payment links
        const { error: clearError } = await supabaseAdmin
          .from("service_requests")
          .update({
            payment_link_expiry: null,
            updated_at: new Date().toISOString()
          })
          .in("id", expiredLinks.map(r => r.id))

        if (clearError) {
          throw new Error(`Clearing expired links: ${clearError.message}`)
        }

        results.expiredPaymentLinks = expiredLinks.length
        console.log(`✅ Cleared ${expiredLinks.length} expired payment links`)
      }
    } catch (error: any) {
      console.error("❌ Error handling expired payment links:", error)
      results.errors.push(`Link cleanup: ${error.message}`)
    }

    // Step 3: Clean up very old failed payments (optional)
    try {
      const oldFailedCutoff = new Date()
      oldFailedCutoff.setDate(oldFailedCutoff.getDate() - 7) // 7 days old

      const { error: deleteOldError } = await supabaseAdmin
        .from("payments")
        .delete()
        .in("payment_status", ["failed", "cancelled", "expired"])
        .lt("created_at", oldFailedCutoff.toISOString())

      if (deleteOldError) {
        console.log("Note: Could not clean old failed payments:", deleteOldError.message)
        // Don't treat this as a critical error
      } else {
        console.log("🗑️  Cleaned up old failed payments")
      }
    } catch (error) {
      // Old payment cleanup is optional
      console.log("Old payment cleanup skipped:", error)
    }

    const summary = `
    🧹 Payment Cleanup Complete
    ⏰ Expired Payments: ${results.expiredPayments}
    🔗 Expired Links: ${results.expiredPaymentLinks}
    ❌ Errors: ${results.errors.length}
    📅 Timestamp: ${results.timestamp}
    `

    console.log(summary)

    // Return results
    return NextResponse.json({
      success: true,
      message: "Automated payment cleanup completed",
      results,
      summary: summary.trim()
    })

  } catch (error: any) {
    console.error("💥 Automated cleanup failed:", error)
    
    return NextResponse.json({
      success: false,
      error: "Automated cleanup failed",
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Helper function to send payment expired notifications
async function sendPaymentExpiredNotification(payment: any) {
  try {
    // This is where you'd integrate with your email service
    console.log(`📧 Would send payment expired notification to: ${payment.service_requests?.clients?.email}`)
    
    const emailData = {
      to: payment.service_requests?.clients?.email,
      subject: `Payment Expired - ${payment.service_requests?.title}`,
      template: 'payment-expired',
      data: {
        clientName: payment.service_requests?.clients?.name,
        serviceTitle: payment.service_requests?.title,
        amount: payment.amount,
        paymentMethod: payment.payment_method,
        contactEmail: process.env.FROM_EMAIL
      }
    }

    // Example with a hypothetical email service:
    // await emailService.send(emailData)
    
    console.log("📧 Payment expired notification prepared:", emailData.subject)
    
  } catch (error) {
    console.error("Failed to prepare payment expired notification:", error)
    throw error
  }
}

// You can also create a manual trigger endpoint
export async function POST(request: Request) {
  try {
    // Check for admin authentication or API key
    const authHeader = request.headers.get('authorization')
    const apiKey = process.env.ADMIN_API_KEY || 'admin123'
    
    if (authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Manually trigger the same cleanup process
    const response = await GET(request)
    return response

  } catch (error) {
    return NextResponse.json({
      error: "Manual cleanup trigger failed"
    }, { status: 500 })
  }
}