// app/api/admin/payments/[id]/cancel/route.ts - Cancel crypto payment
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getAdminUser } from "@/lib/auth/server-auth"
import crypto from "crypto"

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

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const correlationId = crypto.randomUUID()

  try {
    // Check admin authentication
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { reason } = await request.json()

    console.log(`[${correlationId}] Admin cancel crypto payment request:`, {
      paymentId: params.id,
      adminEmail: adminUser.email,
      reason
    })

    // Validate payment exists and is crypto
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select(`
        id,
        payment_status,
        payment_method,
        crypto_address,
        crypto_network,
        crypto_amount,
        crypto_symbol,
        amount,
        request_id,
        metadata
      `)
      .eq("id", params.id)
      .single()

    if (paymentError || !payment) {
      console.error(`[${correlationId}] Payment not found:`, paymentError)
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Check if payment method is crypto
    if (payment.payment_method !== 'crypto') {
      return NextResponse.json({
        error: "Only crypto payments can be cancelled using this endpoint"
      }, { status: 400 })
    }

    // Check if payment is in a cancellable state
    const cancellableStatuses = ['pending', 'processing']
    if (!cancellableStatuses.includes(payment.payment_status)) {
      return NextResponse.json({
        error: `Cannot cancel payment with status: ${payment.payment_status}. Only pending or processing payments can be cancelled.`
      }, { status: 400 })
    }

    // Get existing metadata
    let existingMetadata = {}
    try {
      existingMetadata = payment.metadata ? JSON.parse(payment.metadata) : {}
    } catch {
      // Ignore metadata parsing errors
    }

    // Update payment to cancelled status
    const { error: updateError } = await supabaseAdmin
      .from("payments")
      .update({
        payment_status: "cancelled",
        admin_notes: `Payment manually cancelled by admin ${adminUser.email}. Reason: ${reason || 'No reason provided'}`,
        metadata: JSON.stringify({
          ...existingMetadata,
          cancellation: {
            cancelled_by: adminUser.email,
            cancelled_at: new Date().toISOString(),
            reason: reason || 'No reason provided',
            original_status: payment.payment_status,
            correlation_id: correlationId
          }
        }),
        updated_at: new Date().toISOString()
      })
      .eq("id", params.id)

    if (updateError) {
      console.error(`[${correlationId}] Error cancelling payment:`, updateError)
      return NextResponse.json({
        error: "Failed to cancel payment",
        details: updateError.message
      }, { status: 500 })
    }

    console.log(`[${correlationId}] Crypto payment cancelled successfully:`, {
      paymentId: params.id,
      originalStatus: payment.payment_status,
      cancelledBy: adminUser.email,
      reason: reason || 'No reason provided'
    })

    return NextResponse.json({
      success: true,
      paymentId: params.id,
      message: "Crypto payment cancelled successfully",
      cancellation: {
        cancelled_by: adminUser.email,
        cancelled_at: new Date().toISOString(),
        reason: reason || 'No reason provided',
        original_status: payment.payment_status
      },
      correlationId
    })

  } catch (error: any) {
    console.error(`[${correlationId}] Cancel payment error:`, error)
    return NextResponse.json({
      error: "Internal server error",
      details: error.message,
      correlationId
    }, { status: 500 })
  }
}