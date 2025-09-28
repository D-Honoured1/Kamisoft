// app/api/webhooks/paystack/route.ts - Nigeria-focused Paystack webhook handler
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { paystackService } from '@/lib/paystack'

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

export async function POST(req: NextRequest) {
  let eventData: any = null
  let webhookEventId: string | null = null

  try {
    const body = await req.text()
    const signature = req.headers.get('x-paystack-signature')


    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    // Verify webhook signature using utility function
    if (!paystackService.validateWebhookSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Parse webhook event
    try {
      eventData = JSON.parse(body)
      webhookEventId = eventData.id || `${eventData.event}_${Date.now()}`
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }


    // Handle different event types with improved error handling
    let result: any = null
    switch (eventData.event) {
      case 'charge.success':
        result = await handleChargeSuccess(eventData.data, webhookEventId)
        break
      case 'charge.failed':
        result = await handleChargeFailed(eventData.data, webhookEventId)
        break
      case 'transfer.success':
        result = await handleTransferSuccess(eventData.data, webhookEventId)
        break
      case 'transfer.failed':
        result = await handleTransferFailed(eventData.data, webhookEventId)
        break
      case 'invoice.create':
      case 'invoice.update':
      case 'invoice.payment_failed':
        result = { processed: false, reason: 'Invoice events not implemented yet' }
        break
      default:
        result = { processed: false, reason: 'Event type not handled' }
    }

    // Log webhook processing result

    return NextResponse.json({
      status: 'success',
      event: eventData.event,
      reference: eventData.data?.reference,
      processed: result?.success !== false
    })

  } catch (error: any) {

    // Return 200 to acknowledge receipt but log the error
    return NextResponse.json({
      status: 'error',
      message: 'Webhook processing failed',
      event: eventData?.event || 'unknown',
      error: error.message
    }, { status: 500 })
  }
}

async function handleChargeSuccess(data: any, webhookEventId: string) {
  try {
    const paymentId = data.metadata?.paymentId
    const ngnEquivalent = data.metadata?.ngnEquivalent
    const exchangeRate = data.metadata?.exchangeRate || 1550


    if (!paymentId) {
      return { success: false, error: 'Missing payment ID in metadata' }
    }

    // Check if payment already processed to prevent duplicate processing
    const { data: existingPayment } = await supabaseAdmin
      .from('payments')
      .select('payment_status, paystack_reference')
      .eq('id', paymentId)
      .single()

    if (existingPayment?.payment_status === 'confirmed') {
      return { success: true, message: 'Payment already confirmed' }
    }

    // Update payment status with comprehensive metadata
    const { error } = await supabaseAdmin
      .from('payments')
      .update({
        payment_status: 'confirmed',
        paystack_reference: data.reference,
        confirmed_at: new Date().toISOString(),
        confirmed_by: 'paystack_webhook',
        admin_notes: `Payment confirmed via Paystack webhook: ${data.reference}. Currency: ${data.currency}. Amount: ${data.currency === 'NGN' ? '₦' : '$'}${(data.amount / 100).toLocaleString()}. Channel: ${data.channel}`,
        metadata: JSON.stringify({
          paystack_data: {
            reference: data.reference,
            amount_paid: data.amount / 100,
            currency: data.currency,
            channel: data.channel,
            gateway_response: data.gateway_response,
            paid_at: data.paid_at,
            transaction_date: data.transaction_date,
            authorization: data.authorization,
            customer: data.customer,
            fees: data.fees,
            fees_breakdown: data.fees_breakdown
          },
          ngn_equivalent: ngnEquivalent,
          exchange_rate: exchangeRate,
          webhook_event_id: webhookEventId,
          processed_at: new Date().toISOString()
        }),
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)

    if (error) {
      return { success: false, error: error.message }
    }


    // Update service request status and send notifications
    if (data.metadata?.requestId) {
      try {
        await updateServiceRequestStatus(data.metadata.requestId, data.metadata?.paymentType)
        await sendPaymentConfirmationEmail(data)
      } catch (notificationError: any) {
      }
    }

    return { success: true, paymentId, reference: data.reference }

  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

async function handleChargeFailed(data: any, webhookEventId: string) {
  try {
    const paymentId = data.metadata?.paymentId


    if (paymentId) {
      const { error } = await supabaseAdmin
        .from('payments')
        .update({
          payment_status: 'failed',
          paystack_reference: data.reference,
          error_message: data.gateway_response || 'Payment failed',
          admin_notes: `Payment failed via Paystack webhook: ${data.gateway_response || 'Unknown error'}. Reference: ${data.reference}`,
          metadata: JSON.stringify({
            paystack_failure_data: {
              reference: data.reference,
              gateway_response: data.gateway_response,
              channel: data.channel,
              currency: data.currency,
              amount: data.amount / 100,
              failed_at: data.created_at || new Date().toISOString()
            },
            webhook_event_id: webhookEventId,
            processed_at: new Date().toISOString()
          }),
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, paymentId, status: 'failed' }
    } else {
      return { success: false, error: 'No payment ID in metadata' }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

async function handleTransferSuccess(data: any, webhookEventId: string) {
  try {
    // Handle successful transfers (if you implement automatic payouts)
    return { success: true, type: 'transfer_success' }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

async function handleTransferFailed(data: any, webhookEventId: string) {
  try {
    // Handle failed transfers
    return { success: true, type: 'transfer_failed' }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

async function updateServiceRequestStatus(requestId: string, paymentType?: string) {
  try {
    // Determine new status based on payment type
    const newStatus = paymentType === 'full' ? 'paid_in_full' : 'in_progress'
    
    const { error } = await supabaseAdmin
      .from('service_requests')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (error) {
    } else {
    }
  } catch (error) {
  }
}

async function sendPaymentConfirmationEmail(paystackData: any) {
  try {
    // Get payment and service request details
    const paymentId = paystackData.metadata?.paymentId
    if (!paymentId) return

    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select(`
        *,
        service_requests (
          *,
          clients (*)
        )
      `)
      .eq('id', paymentId)
      .single()

    if (!payment) return

    const emailData = {
      to: payment.service_requests.clients.email,
      subject: `Payment Confirmed - ${payment.service_requests.title}`,
      template: 'payment-confirmation-nigeria',
      data: {
        clientName: payment.service_requests.clients.name,
        serviceTitle: payment.service_requests.title,
        amountPaid: `${paystackData.currency === 'NGN' ? '₦' : '$'}${(paystackData.amount / 100).toLocaleString()}`,
        paymentReference: paystackData.reference,
        paymentMethod: paystackData.channel,
        paymentType: paystackData.metadata?.paymentType === 'split' ? '50% Upfront Payment' : 'Full Payment',
        transactionDate: new Date(paystackData.paid_at).toLocaleString('en-NG'),
        projectStatus: paystackData.metadata?.paymentType === 'full' ? 'Fully Paid - Work will begin immediately' : 'Upfront payment received - Work will begin shortly',
        supportEmail: process.env.FROM_EMAIL
      }
    }


    // TODO: Integrate with your email service (SendGrid, Resend, etc.)
    // await emailService.send(emailData)
    
  } catch (error) {
  }
}