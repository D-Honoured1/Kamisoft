// app/api/payments/verify/route.ts - Payment verification endpoint
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { paystackService } from '@/lib/paystack'

export async function POST(request: NextRequest) {
  try {
    const { reference, paymentId } = await request.json()

    console.log('Payment verification request:', { reference, paymentId })

    // Validate input
    if (!reference) {
      return NextResponse.json({
        error: 'Payment reference is required'
      }, { status: 400 })
    }

    const supabase = createServerClient()

    // Get payment record if paymentId provided
    let payment = null
    if (paymentId) {
      const { data: paymentData, error: paymentError } = await supabase
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

      if (paymentError || !paymentData) {
        console.error('Payment record not found:', paymentError)
        return NextResponse.json({
          error: 'Payment record not found'
        }, { status: 404 })
      }

      payment = paymentData
    } else {
      // Find payment by reference
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select(`
          *,
          service_requests (
            *,
            clients (*)
          )
        `)
        .eq('paystack_reference', reference)
        .single()

      if (paymentError || !paymentData) {
        console.error('Payment record not found by reference:', paymentError)
        return NextResponse.json({
          error: 'Payment record not found'
        }, { status: 404 })
      }

      payment = paymentData
    }

    // Check if payment is already confirmed
    if (payment.payment_status === 'confirmed') {
      return NextResponse.json({
        success: true,
        status: 'already_confirmed',
        message: 'Payment was already confirmed',
        payment: {
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.payment_status,
          confirmed_at: payment.confirmed_at
        }
      })
    }

    // Verify payment with Paystack
    try {
      const verification = await paystackService.verifyTransaction(reference)

      console.log('Paystack verification response:', {
        status: verification.status,
        reference: verification.data.reference,
        amount: verification.data.amount,
        currency: verification.data.currency,
        paymentStatus: verification.data.status
      })

      if (!verification.status || verification.data.status !== 'success') {
        // Payment failed or pending
        await supabase
          .from('payments')
          .update({
            payment_status: verification.data.status === 'failed' ? 'failed' : 'pending',
            error_message: verification.data.gateway_response || verification.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.id)

        return NextResponse.json({
          success: false,
          status: verification.data.status,
          message: verification.data.gateway_response || verification.message,
          payment: {
            id: payment.id,
            status: verification.data.status
          }
        })
      }

      // Payment successful - update database
      const paystackAmount = verification.data.amount / 100 // Convert from kobo/cents
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          payment_status: 'confirmed',
          paystack_reference: verification.data.reference,
          confirmed_at: new Date().toISOString(),
          confirmed_by: 'api_verification',
          admin_notes: `Payment verified via API: ${verification.data.reference}. Gateway: ${verification.data.gateway_response}`,
          metadata: JSON.stringify({
            paystack_data: {
              reference: verification.data.reference,
              amount_paid: paystackAmount,
              currency: verification.data.currency,
              channel: verification.data.channel,
              gateway_response: verification.data.gateway_response,
              paid_at: verification.data.paid_at,
              authorization: verification.data.authorization,
              customer: verification.data.customer
            }
          }),
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id)

      if (updateError) {
        console.error('Error updating payment:', updateError)
        return NextResponse.json({
          error: 'Failed to update payment record'
        }, { status: 500 })
      }

      console.log('Payment confirmed:', payment.id)

      // Update service request status if applicable
      if (payment.service_requests) {
        const newStatus = payment.payment_type === 'full' ? 'paid_in_full' : 'in_progress'

        const { error: serviceUpdateError } = await supabase
          .from('service_requests')
          .update({
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.service_requests.id)

        if (serviceUpdateError) {
          console.error('Error updating service request status:', serviceUpdateError)
        } else {
          console.log('Service request status updated:', payment.service_requests.id, '→', newStatus)
        }
      }

      return NextResponse.json({
        success: true,
        status: 'confirmed',
        message: 'Payment verified and confirmed successfully',
        payment: {
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          paystack_data: {
            reference: verification.data.reference,
            amount_paid: paystackAmount,
            currency: verification.data.currency,
            channel: verification.data.channel,
            gateway_response: verification.data.gateway_response,
            paid_at: verification.data.paid_at
          }
        }
      })

    } catch (verificationError: any) {
      console.error('Paystack verification failed:', verificationError)

      // Update payment as failed
      await supabase
        .from('payments')
        .update({
          payment_status: 'failed',
          error_message: verificationError.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id)

      return NextResponse.json({
        success: false,
        status: 'verification_failed',
        message: 'Payment verification failed',
        error: verificationError.message
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Payment verification error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference')
    const paymentId = searchParams.get('payment_id')

    if (!reference && !paymentId) {
      return NextResponse.json({
        error: 'Payment reference or payment ID is required'
      }, { status: 400 })
    }

    const supabase = createServerClient()

    let query = supabase
      .from('payments')
      .select(`
        *,
        service_requests (
          title,
          status,
          clients (
            name,
            email
          )
        )
      `)

    if (paymentId) {
      query = query.eq('id', paymentId)
    } else if (reference) {
      query = query.eq('paystack_reference', reference)
    }

    const { data: payment, error } = await query.single()

    if (error || !payment) {
      return NextResponse.json({
        error: 'Payment not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        payment_method: payment.payment_method,
        payment_type: payment.payment_type,
        status: payment.payment_status,
        reference: payment.paystack_reference,
        created_at: payment.created_at,
        confirmed_at: payment.confirmed_at,
        service_request: payment.service_requests ? {
          title: payment.service_requests.title,
          status: payment.service_requests.status
        } : null,
        client: payment.service_requests?.clients ? {
          name: payment.service_requests.clients.name,
          email: payment.service_requests.clients.email
        } : null
      }
    })

  } catch (error: any) {
    console.error('Payment lookup error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}