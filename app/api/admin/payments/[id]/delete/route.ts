// app/api/admin/payments/[id]/delete/route.ts
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

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    // Check admin authentication
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: paymentId } = params
    const { searchParams } = new URL(req.url)
    const permanent = searchParams.get('permanent') === 'true'

    console.log(`🗑️ Admin ${adminUser.email} attempting to ${permanent ? 'permanently delete' : 'soft delete'} payment ${paymentId}`)

    // First, get the payment details
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select(`
        id,
        payment_status,
        amount,
        currency,
        payment_method,
        request_id,
        paystack_reference,
        created_at,
        service_requests (
          title,
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

    // Only allow deletion of failed, cancelled, pending, or processing payments
    const deletableStatuses = ['failed', 'cancelled', 'pending', 'processing']
    if (!deletableStatuses.includes(payment.payment_status)) {
      return NextResponse.json({
        error: `Cannot delete payment with status '${payment.payment_status}'. Only failed, cancelled, pending, or processing payments can be deleted.`
      }, { status: 400 })
    }

    console.log(`🔍 Payment to delete:`, {
      id: payment.id,
      status: payment.payment_status,
      amount: payment.amount,
      method: payment.payment_method,
      reference: payment.paystack_reference
    })

    if (permanent) {
      // PERMANENT DELETE: Remove from database completely
      // This is only for failed/cancelled/deleted payments that need to be purged

      // Step 1: Delete audit log entries first (foreign key constraint)
      const { error: auditDeleteError } = await supabaseAdmin
        .from("payment_audit_log")
        .delete()
        .eq("payment_id", paymentId)

      if (auditDeleteError) {
        console.error("❌ Error deleting payment audit records:", auditDeleteError)
        // Continue anyway - table might not exist or be empty
      } else {
        console.log(`🗑️ Deleted audit records for payment ${paymentId}`)
      }

      // Step 2: Physically delete the payment record
      const { error: deleteError } = await supabaseAdmin
        .from("payments")
        .delete()
        .eq("id", paymentId)

      if (deleteError) {
        console.error("❌ Error permanently deleting payment:", deleteError)
        return NextResponse.json({
          error: "Failed to permanently delete payment",
          details: deleteError.message
        }, { status: 500 })
      }

      console.log(`✅ Payment PERMANENTLY deleted: ${paymentId}`)

    } else {
      // SOFT DELETE: Update payment status to 'deleted' instead of actually deleting
      // This maintains audit trail while removing it from active views
      const { error: deleteError } = await supabaseAdmin
        .from("payments")
        .update({
          payment_status: "deleted",
          deleted_at: new Date().toISOString(),
          deleted_by: adminUser.email,
          admin_notes: `Payment deleted by admin ${adminUser.email} on ${new Date().toISOString()}. Original status: ${payment.payment_status}`,
          updated_at: new Date().toISOString()
        })
        .eq("id", paymentId)

      if (deleteError) {
        console.error("❌ Error soft-deleting payment:", deleteError)
        return NextResponse.json({
          error: "Failed to delete payment",
          details: deleteError.message
        }, { status: 500 })
      }

      console.log(`✅ Payment soft-deleted successfully: ${paymentId}`)
    }

    // Log the deletion for audit purposes
    try {
      // Try to log to audit table if it exists
      const auditData = {
        admin_user_id: adminUser.id,
        action: "payment_deleted",
        resource_type: "payment",
        resource_id: paymentId,
        metadata: {
          original_status: payment.payment_status,
          payment_amount: payment.amount,
          payment_method: payment.payment_method,
          paystack_reference: payment.paystack_reference,
          client_email: payment.service_requests?.clients?.email,
          request_title: payment.service_requests?.title,
          deletion_reason: "admin_manual_deletion"
        }
      }

      const { error: auditError } = await supabaseAdmin
        .from("admin_audit_log")
        .insert(auditData)

      if (auditError) {
        // Audit table might not exist, log to console instead
        console.log("📝 Payment deletion audit log (table not available):", {
          admin_email: adminUser.email,
          action: "payment_deleted",
          payment_id: paymentId,
          original_status: payment.payment_status,
          timestamp: new Date().toISOString()
        })
      }
    } catch (auditError) {
      console.error("⚠️ Audit log failed:", auditError)
      // Fallback console logging
      console.log("📝 Fallback payment deletion audit:", {
        admin_email: adminUser.email,
        action: "payment_deleted",
        payment_id: paymentId,
        original_status: payment.payment_status,
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json({
      success: true,
      message: permanent ? "Payment permanently deleted" : "Payment deleted successfully",
      data: {
        payment_id: paymentId,
        original_status: payment.payment_status,
        deletion_type: permanent ? "permanent" : "soft",
        deleted_at: new Date().toISOString(),
        deleted_by: adminUser.email
      }
    })

  } catch (error: any) {
    console.error("💥 Payment deletion error:", error)
    return NextResponse.json({
      error: "Failed to delete payment",
      details: error.message
    }, { status: 500 })
  }
}

// GET endpoint to check if payment can be deleted
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: paymentId } = params

    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .select("id, payment_status, amount, currency, payment_method, created_at")
      .eq("id", paymentId)
      .single()

    if (error || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    const deletableStatuses = ['failed', 'cancelled', 'pending', 'processing']
    const canDelete = deletableStatuses.includes(payment.payment_status)

    return NextResponse.json({
      success: true,
      payment_id: paymentId,
      can_delete: canDelete,
      current_status: payment.payment_status,
      deletable_statuses: deletableStatuses,
      deletion_reason: canDelete
        ? "Payment can be safely deleted"
        : `Cannot delete payment with status '${payment.payment_status}'`
    })

  } catch (error: any) {
    console.error("Error checking payment deletion eligibility:", error)
    return NextResponse.json({
      error: "Failed to check payment deletion eligibility"
    }, { status: 500 })
  }
}