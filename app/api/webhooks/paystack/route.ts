// app/api/webhooks/paystack/route.ts - Paystack webhook handler
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
    
    if (!signature) {
      console.error('No Paystack signature found')
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    // Verify webhook signature (optional - uncomment if you have webhook secret)
    /*
    const secret = process.env.PAYSTACK_WEBHOOK_SECRET
    if (secret) {
      const hash = crypto.createHmac('sha512', secret).update(body).digest('hex')
      if (hash !== signature) {
        console.error('Invalid Paystack signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    }
    */

    const event = JSON.parse(body)
    console.log('Paystack webhook event:', event.event)

    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(event.data)
        break
      case 'charge.failed':
        await handleChargeFailed(event.data)
        break
      default:
        console.log(`Unhandled Paystack event: ${event.event}`)
    }

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    console.error('Paystack webhook error:', error)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}

async function handleChargeSuccess(data: any) {
  try {
    const paymentId = data.metadata?.paymentId
    
    if (!paymentId) {
      console.error('No paymentId in Paystack metadata')
      return
    }

    // Update payment status
    const { error } = await supabaseAdmin
      .from('payments')
      .update({
        payment_status: 'confirmed',
        paystack_reference: data.reference,
        confirmed_at: new Date().toISOString(),
        confirmed_by: 'paystack_webhook',
        admin_notes: `Payment confirmed via Paystack: ${data.reference}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)

    if (error) {
      console.error('Error updating Paystack payment:', error)
      return
    }

    console.log('Paystack payment confirmed:', paymentId)

    // Update service request status
    if (data.metadata?.requestId) {
      await updateServiceRequestStatus(data.metadata.requestId, data.metadata?.paymentType)
    }

  } catch (error) {
    console.error('Error processing Paystack success:', error)
  }
}

async function handleChargeFailed(data: any) {
  try {
    const paymentId = data.metadata?.paymentId
    
    if (paymentId) {
      await supabaseAdmin
        .from('payments')
        .update({
          payment_status: 'failed',
          paystack_reference: data.reference,
          error_message: data.gateway_response || 'Payment failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)

      console.log('Paystack payment failed:', paymentId)
    }
  } catch (error) {
    console.error('Error processing Paystack failure:', error)
  }
}

async function updateServiceRequestStatus(requestId: string, paymentType?: string) {
  try {
    const newStatus = paymentType === 'full' ? 'paid_in_full' : 'in_progress'
    
    await supabaseAdmin
      .from('service_requests')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)

    console.log('Service request status updated:', requestId, newStatus)
  } catch (error) {
    console.error('Error updating service request:', error)
  }
}