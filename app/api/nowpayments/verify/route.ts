// app/api/nowpayments/verify/route.ts - Verify NOWPayments transaction
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { nowPaymentsService } from "@/lib/nowpayments"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  const correlationId = crypto.randomUUID()

  try {
    const supabase = createServerClient()
    const {
      paymentId,
      transactionHash,
      payCurrency,
      customerNote
    } = await request.json()

      paymentId,
      transactionHash: transactionHash?.substring(0, 16) + '...',
      payCurrency,
      hasNote: !!customerNote
    })

    // Validate required fields
    if (!paymentId || !transactionHash) {
      return NextResponse.json({
        error: "Missing required fields: paymentId, transactionHash"
      }, { status: 400 })
    }

    // Validate payment exists
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select(`
        id,
        payment_status,
        crypto_address,
        crypto_network,
        crypto_amount,
        crypto_symbol,
        amount,
        request_id,
        metadata
      `)
      .eq("id", paymentId)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Validate payment is in correct state
    if (!['pending', 'processing'].includes(payment.payment_status)) {
      return NextResponse.json({
        error: `Payment status is ${payment.payment_status}, expected pending or processing`
      }, { status: 400 })
    }

    // Basic transaction hash validation (NOWPayments handles detailed validation)
    if (transactionHash.length < 10 || transactionHash.length > 100) {
      return NextResponse.json({
        error: "Invalid transaction hash format"
      }, { status: 400 })
    }

    // Check if this transaction hash is already used
    const { data: existingTransaction } = await supabase
      .from("payments")
      .select("id")
      .eq("crypto_transaction_hash", transactionHash)
      .neq("id", paymentId)

    if (existingTransaction && existingTransaction.length > 0) {
      return NextResponse.json({
        error: "This transaction hash has already been used for another payment"
      }, { status: 409 })
    }

    // Try to get NOWPayments payment ID from metadata
    let nowpaymentsId: string | null = null

    try {
      const metadata = payment.metadata ? JSON.parse(payment.metadata) : {}
      nowpaymentsId = metadata.nowpayments_payment_id || null
    } catch {
      // Ignore metadata parsing errors
    }

    // If we have a NOWPayments ID, check the status
    let nowpaymentsStatus: string | null = null
    if (nowpaymentsId) {
      try {
        const paymentStatus = await nowPaymentsService.getPaymentStatus(nowpaymentsId)
        nowpaymentsStatus = paymentStatus.payment_status
      } catch (statusError: any) {
      }
    }

    // Update payment with transaction details and mark as processing
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        payment_status: "processing",
        crypto_transaction_hash: transactionHash,
        admin_notes: `Customer submitted transaction hash: ${transactionHash}. ${customerNote ? `Customer note: ${customerNote}` : 'No additional notes.'} ${nowpaymentsStatus ? `NOWPayments status: ${nowpaymentsStatus}` : ''}`,
        metadata: JSON.stringify({
          transaction_submitted: {
            hash: transactionHash,
            pay_currency: payCurrency,
            nowpayments_id: nowpaymentsId,
            nowpayments_status: nowpaymentsStatus,
            submitted_at: new Date().toISOString(),
            customer_note: customerNote,
            confirmation_status: 'pending_verification'
          },
          correlation_id: correlationId
        }),
        updated_at: new Date().toISOString()
      })
      .eq("id", paymentId)

    if (updateError) {
      return NextResponse.json({
        error: "Failed to save transaction details",
        details: updateError.message
      }, { status: 500 })
    }

      paymentId,
      currency: payCurrency,
      transactionHash: transactionHash.substring(0, 16) + '...',
      nowpaymentsId,
      nowpaymentsStatus
    })

    return NextResponse.json({
      success: true,
      paymentId,
      transactionHash,
      payCurrency,
      nowpaymentsId,
      nowpaymentsStatus,
      status: "processing",
      message: nowpaymentsId
        ? "Transaction hash submitted. NOWPayments will automatically verify the payment."
        : "Transaction hash submitted successfully. Payment will be verified by our team within 1-2 hours.",
      correlationId
    })

  } catch (error: any) {
    return NextResponse.json({
      error: "Internal server error",
      details: error.message,
      correlationId
    }, { status: 500 })
  }
}