// app/api/admin/payment-links/[requestId]/deactivate/route.ts
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
    requestId: string
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    // Check admin authentication
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { requestId } = params
    const body = await req.json()
    const { action, reason } = body

    if (action !== 'deactivate') {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    console.log(`🔐 Admin ${adminUser.email} deactivating payment link for request ${requestId}`)

    // First, verify the service request exists and belongs to an approved request
    const { data: serviceRequest, error: requestError } = await supabaseAdmin
      .from("service_requests")
      .select(`
        id,
        title,
        status,
        payment_link_expiry,
        clients (
          name,
          email
        )
      `)
      .eq("id", requestId)
      .single()

    if (requestError || !serviceRequest) {
      return NextResponse.json({ error: "Service request not found" }, { status: 404 })
    }

    // Check if there's an active payment link
    if (!serviceRequest.payment_link_expiry) {
      return NextResponse.json({ 
        error: "No payment link exists for this request" 
      }, { status: 400 })
    }

    const now = new Date()
    const linkExpiry = new Date(serviceRequest.payment_link_expiry)

    // Check if link is already expired
    if (now > linkExpiry) {
      return NextResponse.json({ 
        error: "Payment link has already expired" 
      }, { status: 400 })
    }

    // Deactivate the payment link by setting expiry to now
    const { data: updatedRequest, error: updateError } = await supabaseAdmin
      .from("service_requests")
      .update({
        payment_link_expiry: now.toISOString(), // Set to current time = immediately expired
        updated_at: now.toISOString()
      })
      .eq("id", requestId)
      .select()
      .single()

    if (updateError) {
      console.error("❌ Error deactivating payment link:", updateError)
      return NextResponse.json({ 
        error: "Failed to deactivate payment link" 
      }, { status: 500 })
    }

    // Also cancel any pending payments for this request
    const { data: pendingPayments, error: paymentsError } = await supabaseAdmin
      .from("payments")
      .select("id, payment_status")
      .eq("request_id", requestId)
      .in("payment_status", ["pending", "processing"])

    if (!paymentsError && pendingPayments && pendingPayments.length > 0) {
      console.log(`📋 Found ${pendingPayments.length} pending payments to cancel`)

      const { error: cancelError } = await supabaseAdmin
        .from("payments")
        .update({
          payment_status: "cancelled",
          admin_notes: `Payment cancelled due to link deactivation by ${adminUser.email}. Reason: ${reason || 'manual_deactivation'}`,
          updated_at: now.toISOString()
        })
        .in("id", pendingPayments.map(p => p.id))

      if (cancelError) {
        console.error("⚠️ Warning: Failed to cancel pending payments:", cancelError)
        // Don't fail the main request, just log the warning
      } else {
        console.log(`✅ Cancelled ${pendingPayments.length} pending payments`)
      }
    }

    console.log(`✅ Payment link deactivated successfully for request ${requestId}`)

    // Log the deactivation for audit purposes
    try {
      await supabaseAdmin
        .from("admin_audit_log")
        .insert({
          admin_user_id: adminUser.id,
          action: "payment_link_deactivated",
          resource_type: "service_request",
          resource_id: requestId,
          metadata: {
            reason: reason || 'manual_deactivation',
            previous_expiry: serviceRequest.payment_link_expiry,
            client_email: serviceRequest.clients?.email,
            request_title: serviceRequest.title
          }
        })
    } catch (auditError) {
      console.error("⚠️ Audit log failed:", auditError)
      // Don't fail the request for audit log issues
    }

    return NextResponse.json({
      success: true,
      message: "Payment link deactivated successfully",
      data: {
        request_id: requestId,
        deactivated_at: now.toISOString(),
        deactivated_by: adminUser.email,
        pending_payments_cancelled: pendingPayments?.length || 0
      }
    })

  } catch (error: any) {
    console.error("💥 Payment link deactivation error:", error)
    return NextResponse.json({
      error: "Failed to deactivate payment link",
      details: error.message
    }, { status: 500 })
  }
}

// GET endpoint to check payment link status
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { requestId } = params

    const { data: serviceRequest, error } = await supabaseAdmin
      .from("service_requests")
      .select(`
        id,
        payment_link_expiry,
        status,
        payments (
          id,
          payment_status,
          created_at
        )
      `)
      .eq("id", requestId)
      .single()

    if (error || !serviceRequest) {
      return NextResponse.json({ error: "Service request not found" }, { status: 404 })
    }

    const now = new Date()
    const linkExpiry = serviceRequest.payment_link_expiry ? new Date(serviceRequest.payment_link_expiry) : null
    
    const status = {
      has_link: !!serviceRequest.payment_link_expiry,
      is_active: linkExpiry && now < linkExpiry,
      is_expired: linkExpiry && now >= linkExpiry,
      expires_at: serviceRequest.payment_link_expiry,
      pending_payments: serviceRequest.payments?.filter(p => 
        p.payment_status === 'pending' || p.payment_status === 'processing'
      ).length || 0,
      time_until_expiry: linkExpiry ? Math.max(0, linkExpiry.getTime() - now.getTime()) : 0
    }

    return NextResponse.json({
      success: true,
      request_id: requestId,
      link_status: status
    })

  } catch (error: any) {
    console.error("Error checking payment link status:", error)
    return NextResponse.json({
      error: "Failed to check payment link status"
    }, { status: 500 })
  }
}