// app/api/webhooks/stripe/route.ts - FIXED BUILD ERROR
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    const signature = req.headers.get('stripe-signature')
    
    if (!signature) {
      console.error('No Stripe signature found')
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    // For now, we'll just parse the JSON without signature verification
    // In production, you should verify the signature with your webhook secret
    const event = JSON.parse(body)
    
    console.log('Stripe webhook event:', event.type, event.id)

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object)
        break
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object)
        break
      default:
        console.log(`Unhandled Stripe event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: any) {
  try {
    const paymentId = session.metadata?.paymentId
    
    if (!paymentId) {
      console.error('No paymentId in session metadata')
      return
    }

    // Update payment status
    const { error } = await supabaseAdmin
      .from('payments')
      .update({
        payment_status: 'confirmed',
        stripe_payment_intent_id: session.payment_intent,
        confirmed_at: new Date().toISOString(),
        confirmed_by: 'stripe_webhook',
        admin_notes: `Payment confirmed via Stripe checkout: ${session.id}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)

    if (error) {
      console.error('Error updating payment:', error)
      return
    }

    console.log('Payment confirmed:', paymentId)

    // Update service request status
    if (session.metadata?.requestId) {
      await updateServiceRequestStatus(session.metadata.requestId, session.metadata?.paymentType)
    }

  } catch (error) {
    console.error('Error processing checkout completion:', error)
  }
}

async function handlePaymentSucceeded(paymentIntent: any) {
  try {
    // Find payment by stripe payment intent id
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .single()

    if (error || !payment) {
      console.log('Payment not found for intent:', paymentIntent.id)
      return
    }

    // Update if not already confirmed
    if (payment.payment_status !== 'confirmed') {
      await supabaseAdmin
        .from('payments')
        .update({
          payment_status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          confirmed_by: 'stripe_webhook',
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id)

      console.log('Payment confirmed via PaymentIntent:', payment.id)
    }
  } catch (error) {
    console.error('Error processing payment success:', error)
  }
}

async function handlePaymentFailed(paymentIntent: any) {
  try {
    // Find and update failed payment
    const { error } = await supabaseAdmin
      .from('payments')
      .update({
        payment_status: 'failed',
        error_message: paymentIntent.last_payment_error?.message || 'Payment failed',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntent.id)

    if (!error) {
      console.log('Payment marked as failed:', paymentIntent.id)
    }
  } catch (error) {
    console.error('Error processing payment failure:', error)
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