import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server-auth"

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAuth()

    const supabase = createServerClient()
    const {
      requestId,
      amount,
      paymentMethod,
      paymentDate,
      reference,
      bankName,
      depositSlip,
      notes,
      paymentType,
      adminVerified = true
    } = await request.json()

    // Validate required fields
    if (!requestId || !amount || !paymentMethod || !paymentDate || !reference) {
      return NextResponse.json(
        { error: "Missing required fields: requestId, amount, paymentMethod, paymentDate, reference" },
        { status: 400 }
      )
    }

    // Validate amount
    const paymentAmount = parseFloat(amount)
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid payment amount" },
        { status: 400 }
      )
    }

    // Get the service request to validate
    const { data: serviceRequest, error: requestError } = await supabase
      .from("service_requests")
      .select("id, estimated_cost, total_paid, balance_due, status")
      .eq("id", requestId)
      .single()

    if (requestError || !serviceRequest) {
      return NextResponse.json(
        { error: "Service request not found" },
        { status: 404 }
      )
    }

    // Validate payment amount against balance
    const currentBalance = (serviceRequest.estimated_cost || 0) - (serviceRequest.total_paid || 0)

    if (paymentType !== "full" && paymentAmount > currentBalance) {
      return NextResponse.json(
        { error: `Payment amount ($${paymentAmount}) exceeds balance due ($${currentBalance})` },
        { status: 400 }
      )
    }

    // Check for duplicate reference to prevent accidental double-entry
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id")
      .eq("request_id", requestId)
      .eq("payment_method", paymentMethod)
      .ilike("metadata", `%${reference}%`)
      .single()

    if (existingPayment) {
      return NextResponse.json(
        { error: "A payment with this reference already exists for this request" },
        { status: 400 }
      )
    }

    // Determine payment sequence
    const { data: existingPayments } = await supabase
      .from("payments")
      .select("payment_sequence")
      .eq("request_id", requestId)
      .order("payment_sequence", { ascending: false })

    const nextSequence = existingPayments && existingPayments.length > 0
      ? (existingPayments[0].payment_sequence || 0) + 1
      : 1

    // Prepare payment metadata
    const metadata = {
      manualEntry: true,
      adminVerified,
      paymentDate,
      reference,
      bankName: bankName || undefined,
      depositSlip: depositSlip || undefined,
      notes: notes || undefined,
      entryTimestamp: new Date().toISOString(),
      paymentType
    }

    // Create the payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        request_id: requestId,
        amount: paymentAmount,
        currency: "USD",
        payment_method: paymentMethod,
        payment_status: adminVerified ? "completed" : "pending", // Admin can pre-verify
        payment_type: paymentType === "full" ? "full" : "split",
        payment_sequence: nextSequence,
        is_partial_payment: paymentType !== "full",
        total_amount_due: serviceRequest.estimated_cost,
        admin_notes: notes,
        metadata: JSON.stringify(metadata),
        created_at: paymentDate + "T00:00:00Z", // Use the specified payment date
        updated_at: new Date().toISOString(),
        // Manual payment tracking columns
        manual_entry: true,
        admin_verified: adminVerified,
        payment_source: 'manual',
        verification_date: adminVerified ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (paymentError) {
      return NextResponse.json(
        { error: "Failed to create payment record" },
        { status: 500 }
      )
    }

    // Update service request totals (this should trigger the database function)
    // But let's also manually update to ensure consistency
    const newTotalPaid = (serviceRequest.total_paid || 0) + paymentAmount
    const newBalanceDue = Math.max(0, (serviceRequest.estimated_cost || 0) - newTotalPaid)

    // Determine new partial payment status
    let newPartialPaymentStatus = "none"
    if (serviceRequest.estimated_cost && serviceRequest.estimated_cost > 0) {
      if (newTotalPaid === 0) {
        newPartialPaymentStatus = "none"
      } else if (newBalanceDue === 0) {
        newPartialPaymentStatus = "completed"
      } else {
        newPartialPaymentStatus = "first_paid"
      }
    }

    const { error: updateError } = await supabase
      .from("service_requests")
      .update({
        total_paid: newTotalPaid,
        balance_due: newBalanceDue,
        partial_payment_status: newPartialPaymentStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", requestId)

    if (updateError) {
      // Don't fail the whole operation, as the payment was created successfully
    }

    // Log the manual payment for audit purposes

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        payment_method: payment.payment_method,
        payment_status: payment.payment_status,
        created_at: payment.created_at
      },
      serviceRequest: {
        total_paid: newTotalPaid,
        balance_due: newBalanceDue,
        partial_payment_status: newPartialPaymentStatus
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}