// app/api/webhooks/nowpayments/route.ts - NOWPayments IPN webhook handler
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { nowPaymentsService } from "@/lib/nowpayments"
import crypto from "crypto"

interface NOWPaymentsIPN {
  payment_id: string
  payment_status: string
  pay_address: string
  price_amount: number
  price_currency: string
  pay_amount: number
  actually_paid?: number
  pay_currency: string
  order_id?: string
  order_description?: string
  purchase_id?: string
  outcome_amount?: number
  outcome_currency?: string
  created_at: string
  updated_at: string
  payin_extra_id?: string
  payout_extra_id?: string
  smart_contract?: string
  network?: string
  network_precision?: number
  time_limit?: string
  burning_percent?: string
  expiration_estimate_date?: string
  is_fixed_rate?: boolean
  is_fee_paid_by_user?: boolean
}

export async function POST(request: NextRequest) {
  const correlationId = crypto.randomUUID()

  try {
    const supabase = createServerClient()
    const body = await request.text()
    const signature = request.headers.get('x-nowpayments-sig')

    console.log(`[${correlationId}] NOWPayments IPN received:`, {
      hasSignature: !!signature,
      bodyLength: body.length
    })

    // Validate webhook signature if secret is configured
    const webhookSecret = process.env.NOWPAYMENTS_IPN_SECRET
    if (webhookSecret && signature) {
      const isValid = nowPaymentsService.validateWebhookSignature(body, signature, webhookSecret)
      if (!isValid) {
        console.error(`[${correlationId}] Invalid webhook signature`)
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    } else if (webhookSecret) {
      console.warn(`[${correlationId}] Webhook secret configured but no signature provided`)
    }

    // Parse the IPN data
    let ipnData: NOWPaymentsIPN
    try {
      ipnData = JSON.parse(body)
    } catch (parseError) {
      console.error(`[${correlationId}] Failed to parse IPN data:`, parseError)
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    console.log(`[${correlationId}] NOWPayments IPN data:`, {
      payment_id: ipnData.payment_id,
      payment_status: ipnData.payment_status,
      order_id: ipnData.order_id,
      pay_currency: ipnData.pay_currency,
      price_amount: ipnData.price_amount,
      pay_amount: ipnData.pay_amount,
      actually_paid: ipnData.actually_paid
    })

    // Find the payment in our database using order_id (which is our payment ID)
    if (!ipnData.order_id) {
      console.error(`[${correlationId}] No order_id in IPN data`)
      return NextResponse.json({ error: "Missing order_id" }, { status: 400 })
    }

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select(`
        id,
        payment_status,
        amount,
        crypto_address,
        crypto_network,
        crypto_amount,
        crypto_symbol,
        request_id,
        metadata
      `)
      .eq("id", ipnData.order_id)
      .single()

    if (paymentError || !payment) {
      console.error(`[${correlationId}] Payment not found for order_id ${ipnData.order_id}:`, paymentError)
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Parse existing metadata
    let metadata: any = {}
    try {
      metadata = payment.metadata ? JSON.parse(payment.metadata) : {}
    } catch {
      metadata = {}
    }

    // Update metadata with IPN information
    metadata.nowpayments_ipn = {
      ...ipnData,
      received_at: new Date().toISOString(),
      correlation_id: correlationId
    }

    // Determine the new payment status based on NOWPayments status
    let newPaymentStatus = payment.payment_status
    let updateServiceRequest = false

    switch (ipnData.payment_status.toLowerCase()) {
      case 'waiting':
        newPaymentStatus = 'processing'
        break
      case 'confirming':
        newPaymentStatus = 'processing'
        break
      case 'confirmed':
      case 'finished':
        newPaymentStatus = 'confirmed'
        updateServiceRequest = true
        break
      case 'partially_paid':
        newPaymentStatus = 'processing'
        break
      case 'failed':
      case 'refunded':
      case 'expired':
        newPaymentStatus = 'failed'
        break
      default:
        console.warn(`[${correlationId}] Unknown NOWPayments status: ${ipnData.payment_status}`)
        break
    }

    // Update payment record
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        payment_status: newPaymentStatus,
        crypto_transaction_hash: ipnData.payment_id, // Store NOWPayments payment ID as transaction reference
        admin_notes: `NOWPayments IPN: ${ipnData.payment_status}. ${ipnData.actually_paid ? `Actually paid: ${ipnData.actually_paid} ${ipnData.pay_currency}` : ''}`,
        metadata: JSON.stringify(metadata),
        updated_at: new Date().toISOString()
      })
      .eq("id", ipnData.order_id)

    if (updateError) {
      console.error(`[${correlationId}] Error updating payment:`, updateError)
      return NextResponse.json({
        error: "Failed to update payment",
        details: updateError.message
      }, { status: 500 })
    }

    // Update service request if payment is confirmed
    if (updateServiceRequest && payment.request_id) {
      const { error: requestUpdateError } = await supabase
        .from("service_requests")
        .update({
          status: "confirmed",
          updated_at: new Date().toISOString()
        })
        .eq("id", payment.request_id)

      if (requestUpdateError) {
        console.error(`[${correlationId}] Error updating service request:`, requestUpdateError)
        // Don't fail the webhook for this error, just log it
      } else {
        console.log(`[${correlationId}] Service request ${payment.request_id} marked as confirmed`)
      }
    }

    console.log(`[${correlationId}] NOWPayments IPN processed successfully:`, {
      payment_id: ipnData.payment_id,
      order_id: ipnData.order_id,
      old_status: payment.payment_status,
      new_status: newPaymentStatus,
      nowpayments_status: ipnData.payment_status,
      service_request_updated: updateServiceRequest
    })

    // Return success response
    return NextResponse.json({
      success: true,
      payment_id: ipnData.payment_id,
      order_id: ipnData.order_id,
      status: newPaymentStatus,
      message: "IPN processed successfully"
    })

  } catch (error: any) {
    console.error(`[${correlationId}] NOWPayments IPN error:`, error)
    return NextResponse.json({
      error: "Internal server error",
      details: error.message,
      correlationId
    }, { status: 500 })
  }
}

// GET endpoint for webhook verification (some providers require this)
export async function GET() {
  return NextResponse.json({
    message: "NOWPayments IPN webhook endpoint",
    status: "active"
  })
}