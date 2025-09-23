// app/api/webhooks/paystack/route.ts - Nigeria-focused Paystack webhook handler
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

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
  try {
    const body = await req.text()
    const signature = req.headers.get('x-paystack-signature')
    
    console.log('🔔 Paystack webhook received')
    
    if (!signature) {
      console.error('❌ No Paystack signature found')
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    // Verify webhook signature if webhook secret is configured
    const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET
    if (webhookSecret) {
      const hash = crypto.createHmac('sha512', webhookSecret).update(body).digest('hex')
      if (hash !== signature) {
        console.error('❌ Invalid Paystack signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    }

    const event = JSON.parse(body)
    console.log('📋 Paystack webhook event:', event.event, 'Reference:', event.data?.reference)

    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(event.data)
        break
      case 'charge.failed':
        await handleChargeFailed(event.data)
        break
      case 'transfer.success':
        await handleTransferSuccess(event.data)
        break
      case 'transfer.failed':
        await handleTransferFailed(event.data)
        break
      default:
        console.log(`ℹ️ Unhandled Paystack event: ${event.event}`)
    }

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    console.error('💥 Paystack webhook error:', error)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}

async function handleChargeSuccess(data: any) {
  try {
    const paymentId = data.metadata?.paymentId
    const ngnEquivalent = data.metadata?.ngnEquivalent
    const exchangeRate = data.metadata?.exchangeRate || 1550
    
    console.log('✅ Processing successful charge:', {
      paymentId,
      reference: data.reference,
      amount: data.amount / 100, // Paystack sends in kobo/cents
      currency: data.currency,
      ngnEquivalent
    })
    
    if (!paymentId) {
      console.error('❌ No paymentId in Paystack metadata')
      return
    }

    // Calculate the actual USD amount from Paystack's response
    let usdAmount = data.amount / 100
    if (data.currency === 'NGN') {
      // If payment was in NGN, convert back to USD
      usdAmount = (data.amount / 100) / exchangeRate
    }

    // Update payment status
    const { error } = await supabaseAdmin
      .from('payments')
      .update({
        payment_status: 'confirmed',
        paystack_reference: data.reference,
        confirmed_at: new Date().toISOString(),
        confirmed_by: 'paystack_webhook',
        admin_notes: `Payment confirmed via Paystack: ${data.reference}. Currency: ${data.currency}. Amount: ${data.currency === 'NGN' ? '₦' : '$'}${(data.amount / 100).toLocaleString()}`,
        metadata: JSON.stringify({
          paystack_data: {
            reference: data.reference,
            amount_paid: data.amount / 100,
            currency: data.currency,
            channel: data.channel,
            gateway_response: data.gateway_response,
            paid_at: data.paid_at,
            transaction_date: data.transaction_date
          },
          ngn_equivalent: ngnEquivalent,
          exchange_rate: exchangeRate
        }),
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)

    if (error) {
      console.error('❌ Error updating Paystack payment:', error)
      return
    }

    console.log('✅ Paystack payment confirmed:', paymentId)

    // Update service request status and send notifications
    if (data.metadata?.requestId) {
      await updateServiceRequestStatus(data.metadata.requestId, data.metadata?.paymentType)
      await sendPaymentConfirmationEmail(data)
    }

  } catch (error) {
    console.error('❌ Error processing Paystack success:', error)
  }
}

async function handleChargeFailed(data: any) {
  try {
    const paymentId = data.metadata?.paymentId
    
    console.log('❌ Processing failed charge:', {
      paymentId,
      reference: data.reference,
      gateway_response: data.gateway_response
    })
    
    if (paymentId) {
      await supabaseAdmin
        .from('payments')
        .update({
          payment_status: 'failed',
          paystack_reference: data.reference,
          error_message: data.gateway_response || 'Payment failed',
          admin_notes: `Payment failed via Paystack: ${data.gateway_response || 'Unknown error'}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)

      console.log('❌ Paystack payment marked as failed:', paymentId)
    }
  } catch (error) {
    console.error('❌ Error processing Paystack failure:', error)
  }
}

async function handleTransferSuccess(data: any) {
  try {
    console.log('💰 Transfer successful:', data.reference)
    // Handle successful transfers (if you implement automatic payouts)
  } catch (error) {
    console.error('❌ Error processing transfer success:', error)
  }
}

async function handleTransferFailed(data: any) {
  try {
    console.log('❌ Transfer failed:', data.reference, data.failure_reason)
    // Handle failed transfers
  } catch (error) {
    console.error('❌ Error processing transfer failure:', error)
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
      console.error('❌ Error updating service request status:', error)
    } else {
      console.log('✅ Service request status updated:', requestId, '→', newStatus)
    }
  } catch (error) {
    console.error('❌ Error updating service request:', error)
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
        supportEmail: 'hello@kamisoftenterprises.online'
      }
    }

    console.log('📧 Would send payment confirmation email to:', emailData.to)
    console.log('📄 Email data:', emailData)

    // TODO: Integrate with your email service (SendGrid, Resend, etc.)
    // await emailService.send(emailData)
    
  } catch (error) {
    console.error('❌ Error sending payment confirmation email:', error)
  }
}