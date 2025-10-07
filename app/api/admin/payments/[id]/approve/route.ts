// app/api/admin/payments/[id]/approve/route.ts
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

interface RouteParams {
  params: {
    id: string
  }
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    // Check admin authentication
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: paymentId } = params
    const { paymentStatus, paystackReference } = await req.json()

    console.log(`✅ Admin ${adminUser.email} attempting to approve payment ${paymentId}`)

    // First, get the payment details
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select(`
        id,
        payment_status,
        amount,
        currency,
        payment_method,
        payment_type,
        request_id,
        paystack_reference,
        created_at,
        service_requests (
          id,
          title,
          status,
          estimated_cost,
          clients (
            name,
            email
          )
        )
      `)
      .eq("id", paymentId)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Allow approval of various payment statuses:
    // - 'success', 'completed': Paystack payments that succeeded
    // - 'pending': Manual payments (bank transfer, crypto) awaiting admin verification
    // - 'processing': Payments that are being processed
    const approvableStatuses = ['success', 'completed', 'pending', 'processing']
    if (!approvableStatuses.includes(payment.payment_status)) {
      return NextResponse.json({
        error: `Cannot approve payment with status '${payment.payment_status}'. Only pending, processing, success, or completed payments can be approved.`
      }, { status: 400 })
    }

    // Don't approve already confirmed payments
    if (payment.payment_status === 'confirmed') {
      return NextResponse.json({
        error: "Payment is already confirmed"
      }, { status: 400 })
    }

    console.log(`🔍 Payment to approve:`, {
      id: payment.id,
      status: payment.payment_status,
      amount: payment.amount,
      method: payment.payment_method,
      type: payment.payment_type,
      reference: payment.paystack_reference
    })

    // Update payment status to 'confirmed'
    const { error: approveError } = await supabaseAdmin
      .from("payments")
      .update({
        payment_status: "confirmed",
        confirmed_at: new Date().toISOString(),
        confirmed_by: adminUser.email,
        admin_notes: `Payment approved and confirmed by admin ${adminUser.email} on ${new Date().toISOString()}. Previous status: ${payment.payment_status}`,
        updated_at: new Date().toISOString()
      })
      .eq("id", paymentId)

    if (approveError) {
      console.error("❌ Error approving payment:", approveError)
      return NextResponse.json({
        error: "Failed to approve payment",
        details: approveError.message
      }, { status: 500 })
    }

    console.log(`✅ Payment approved successfully: ${paymentId}`)

    // Update service request status based on payment type
    if (payment.service_requests) {
      let newRequestStatus = null

      if (payment.payment_type === 'full') {
        // Full payment received - mark as paid and ready to start
        newRequestStatus = 'paid'
      } else if (payment.payment_type === 'split') {
        // Check if this is the first or second payment
        const { data: existingPayments } = await supabaseAdmin
          .from("payments")
          .select("payment_type, payment_status")
          .eq("request_id", payment.request_id)
          .eq("payment_status", "confirmed")

        const confirmedPayments = existingPayments || []
        const hasFullPayment = confirmedPayments.some(p => p.payment_type === 'full')
        const splitPayments = confirmedPayments.filter(p => p.payment_type === 'split')

        if (hasFullPayment || splitPayments.length >= 2) {
          newRequestStatus = 'paid'
        } else {
          newRequestStatus = 'partially_paid'
        }
      }

      if (newRequestStatus) {
        const { error: statusUpdateError } = await supabaseAdmin
          .from("service_requests")
          .update({
            status: newRequestStatus,
            payment_confirmed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("id", payment.request_id)

        if (statusUpdateError) {
          console.error("⚠️ Error updating service request status:", statusUpdateError)
          // Don't fail the payment approval for this
        } else {
          console.log(`📝 Service request ${payment.request_id} status updated to: ${newRequestStatus}`)
        }
      }
    }

    // Log the approval for audit purposes
    try {
      const auditData = {
        admin_user_id: adminUser.id,
        action: "payment_approved",
        resource_type: "payment",
        resource_id: paymentId,
        metadata: {
          original_status: payment.payment_status,
          new_status: "confirmed",
          payment_amount: payment.amount,
          payment_currency: payment.currency,
          payment_method: payment.payment_method,
          payment_type: payment.payment_type,
          paystack_reference: payment.paystack_reference,
          client_email: payment.service_requests?.clients?.email,
          request_title: payment.service_requests?.title,
          approval_reason: "admin_manual_approval"
        }
      }

      const { error: auditError } = await supabaseAdmin
        .from("admin_audit_log")
        .insert(auditData)

      if (auditError) {
        // Audit table might not exist, log to console instead
        console.log("📝 Payment approval audit log (table not available):", {
          admin_email: adminUser.email,
          action: "payment_approved",
          payment_id: paymentId,
          original_status: payment.payment_status,
          timestamp: new Date().toISOString()
        })
      }
    } catch (auditError) {
      console.error("⚠️ Audit log failed:", auditError)
      // Fallback console logging
      console.log("📝 Fallback payment approval audit:", {
        admin_email: adminUser.email,
        action: "payment_approved",
        payment_id: paymentId,
        original_status: payment.payment_status,
        timestamp: new Date().toISOString()
      })
    }

    // TODO: Send confirmation email to client
    // This would integrate with your email service
    console.log("📧 Would send payment confirmation email to:", payment.service_requests?.clients?.email)

    return NextResponse.json({
      success: true,
      message: "Payment approved and confirmed successfully",
      data: {
        payment_id: paymentId,
        original_status: payment.payment_status,
        new_status: "confirmed",
        confirmed_at: new Date().toISOString(),
        confirmed_by: adminUser.email,
        service_request_updated: !!payment.service_requests
      }
    })

  } catch (error: any) {
    console.error("💥 Payment approval error:", error)
    return NextResponse.json({
      error: "Failed to approve payment",
      details: error.message
    }, { status: 500 })
  }
}

// GET endpoint to check if payment can be approved
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: paymentId } = params

    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .select("id, payment_status, amount, currency, payment_method, payment_type, created_at")
      .eq("id", paymentId)
      .single()

    if (error || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    const approvableStatuses = ['success', 'completed', 'pending', 'processing']
    const canApprove = approvableStatuses.includes(payment.payment_status) && payment.payment_status !== 'confirmed'

    return NextResponse.json({
      success: true,
      payment_id: paymentId,
      can_approve: canApprove,
      current_status: payment.payment_status,
      approvable_statuses: approvableStatuses,
      approval_reason: canApprove
        ? "Payment can be approved"
        : `Cannot approve payment with status '${payment.payment_status}'`
    })

  } catch (error: any) {
    console.error("Error checking payment approval eligibility:", error)
    return NextResponse.json({
      error: "Failed to check payment approval eligibility"
    }, { status: 500 })
  }
}