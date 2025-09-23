// app/api/webhooks/stripe/route.ts - Stripe Webhook Handler
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

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
    const signature = headers().get('stripe-signature')!
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('Stripe webhook event:', event.type, event.id)

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log('Processing completed checkout session:', session.id)
    
    const paymentId = session.metadata?.paymentId
    const requestId = session.metadata?.requestId
    const paymentType = session.metadata?.paymentType

    if (!paymentId) {
      console.error('No paymentId in session metadata')
      return
    }

    // Update payment status to confirmed
    const { data: payment, error: updateError } = await supabaseAdmin
      .from('payments')
      .update({
        payment_status: 'confirmed',
        stripe_payment_intent_id: session.payment_intent as string,
        confirmed_at: new Date().toISOString(),
        confirmed_by: 'stripe_webhook',
        admin_notes: `Payment confirmed via Stripe checkout session: ${session.id}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating payment:', updateError)
      return
    }

    console.log('Payment confirmed:', paymentId)

    // Update service request status if this was the first payment
    if (requestId) {
      const { data: serviceRequest, error: requestError } = await supabaseAdmin
        .from('service_requests')
        .select('status')
        .eq('id', requestId)
        .single()

      if (serviceRequest && serviceRequest.status === 'approved') {
        await supabaseAdmin
          .from('service_requests')
          .update({ 
            status: paymentType === 'full' ? 'paid_in_full' : 'in_progress',
            updated_at: new Date().toISOString()
          })
          .eq('id', requestId)

        console.log('Service request status updated:', requestId)
      }
    }

    // Send confirmation email (implement as needed)
    await sendPaymentConfirmationEmail(session, payment)

  } catch (error) {
    console.error('Error processing checkout session completion:', error)
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Payment intent succeeded:', paymentIntent.id)
    
    // Find payment by stripe payment intent id
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .single()

    if (error || !payment) {
      console.log('Payment not found for payment intent:', paymentIntent.id)
      return
    }

    // Update payment status if not already confirmed
    if (payment.payment_status !== 'confirmed') {
      await supabaseAdmin
        .from('payments')
        .update({
          payment_status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          confirmed_by: 'stripe_webhook',
          admin_notes: `Payment confirmed via PaymentIntent: ${paymentIntent.id}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id)

      console.log('Payment confirmed via PaymentIntent:', payment.id)
    }
  } catch (error) {
    console.error('Error processing payment intent success:', error)
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Payment intent failed:', paymentIntent.id)
    
    // Find payment by stripe payment intent id
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .single()

    if (error || !payment) {
      console.log('Payment not found for failed payment intent:', paymentIntent.id)
      return
    }

    // Update payment status to failed
    await supabaseAdmin
      .from('payments')
      .update({
        payment_status: 'failed',
        error_message: paymentIntent.last_payment_error?.message || 'Payment failed',
        admin_notes: `Payment failed via PaymentIntent: ${paymentIntent.id}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id)

    console.log('Payment marked as failed:', payment.id)
  } catch (error) {
    console.error('Error processing payment intent failure:', error)
  }
}

async function sendPaymentConfirmationEmail(session: Stripe.Checkout.Session, payment: any) {
  try {
    // Implement email sending logic here
    console.log('Would send confirmation email for payment:', payment.id)
    
    const emailData = {
      to: session.customer_email,
      subject: 'Payment Confirmation - Kamisoft Enterprises',
      template: 'payment-confirmation',
      data: {
        amount: session.amount_total ? session.amount_total / 100 : 0,
        paymentId: payment.id,
        sessionId: session.id
      }
    }

    // Example: await emailService.send(emailData)
    console.log('Payment confirmation email prepared:', emailData)
  } catch (error) {
    console.error('Error sending confirmation email:', error)
  }
}