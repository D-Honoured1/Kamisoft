// app/api/payments/create/route.ts - UPDATED VERSION WITH PAYMENT TYPE SUPPORT
export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { requestId, paymentMethod, amount, paymentType, metadata } = await request.json()

    // Validate input
    if (!requestId || !paymentMethod || !amount || !paymentType) {
      return NextResponse.json({ 
        error: "Missing required fields: requestId, paymentMethod, amount, paymentType" 
      }, { status: 400 })
    }

    // Validate payment type
    if (!['split', 'full'].includes(paymentType)) {
      return NextResponse.json({ 
        error: "Invalid payment type. Must be 'split' or 'full'" 
      }, { status: 400 })
    }

    // Get service request details with proper foreign key relationship
    const { data: serviceRequest, error: requestError } = await supabase
      .from("service_requests")
      .select(`
        *,
        clients (*)
      `)
      .eq("id", requestId)
      .single()

    if (requestError || !serviceRequest) {
      console.error("Service request fetch error:", requestError)
      return NextResponse.json({ error: "Service request not found" }, { status: 404 })
    }

    // Verify the request is approved
    if (serviceRequest.status !== "approved") {
      return NextResponse.json({ 
        error: "Payment not allowed. Request must be approved first." 
      }, { status: 400 })
    }

    // Validate payment amount against service request
    const totalCost = serviceRequest.estimated_cost || 0
    let expectedAmount: number

    if (paymentType === "split") {
      expectedAmount = totalCost * 0.5 // 50% for split payment
    } else {
      expectedAmount = totalCost * 0.9 // 10% discount for full payment
    }

    // Allow small rounding differences
    if (Math.abs(amount - expectedAmount) > 0.01) {
      return NextResponse.json({ 
        error: `Invalid amount. Expected ${expectedAmount.toFixed(2)} for ${paymentType} payment` 
      }, { status: 400 })
    }

    // Create payment record with enhanced metadata
    const paymentData = {
      request_id: requestId,
      amount: amount,
      currency: "USD",
      payment_method: paymentMethod,
      payment_status: "pending",
      payment_type: paymentType,
      metadata: {
        ...metadata,
        original_cost: totalCost,
        payment_method: paymentMethod,
        client_email: serviceRequest.clients?.email,
        client_name: serviceRequest.clients?.name,
        service_title: serviceRequest.title,
        created_at: new Date().toISOString()
      }
    }

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert(paymentData)
      .select("id")
      .single()

    if (paymentError) {
      console.error("Error creating payment:", paymentError)
      return NextResponse.json({ 
        error: "Failed to create payment record",
        details: paymentError.message 
      }, { status: 500 })
    }

    let checkoutUrl = null

    // Handle different payment methods
    switch (paymentMethod) {
      case "stripe":
        checkoutUrl = await createStripeCheckout(payment.id, amount, serviceRequest, paymentType, metadata)
        break
      case "paystack":
        checkoutUrl = await createPaystackCheckout(payment.id, amount, serviceRequest, paymentType, metadata)
        break
      case "bank_transfer":
        // Send bank transfer instructions via email
        await sendBankTransferInstructions(serviceRequest.clients.email, payment.id, amount, paymentType, metadata)
        break
      case "crypto":
        return NextResponse.json({ error: "Cryptocurrency payments not yet supported" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      checkoutUrl,
      paymentType,
      amount,
      message: paymentMethod === "bank_transfer"
        ? "Bank transfer instructions sent to your email"
        : "Payment session created successfully",
    })
  } catch (error) {
    console.error("Error creating payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function createStripeCheckout(
  paymentId: string, 
  amount: number, 
  serviceRequest: any, 
  paymentType: string,
  metadata: any
) {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
    
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("Stripe secret key not configured")
      throw new Error("Payment configuration error")
    }

    // Create descriptive payment description
    const paymentDescription = paymentType === "split" 
      ? `${metadata.description} (${metadata.upfront_percent}% upfront)`
      : `${metadata.description} (${metadata.discount_percent}% discount applied)`

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: serviceRequest.title,
            description: paymentDescription,
            metadata: {
              paymentType: paymentType,
              originalAmount: metadata.original_amount?.toString() || '0',
              ...(paymentType === 'full' && { savings: metadata.savings?.toString() || '0' }),
              ...(paymentType === 'split' && { remainingAmount: metadata.remaining_amount?.toString() || '0' })
            }
          },
          unit_amount: Math.round(amount * 100), // Stripe uses cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?payment_id=${paymentId}&session_id={CHECKOUT_SESSION_ID}&type=${paymentType}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancelled?payment_id=${paymentId}`,
      metadata: {
        paymentId: paymentId,
        requestId: serviceRequest.id,
        clientEmail: serviceRequest.clients.email,
        paymentType: paymentType,
        originalAmount: metadata.original_amount?.toString() || '0',
        ...(paymentType === 'full' && { 
          discountPercent: metadata.discount_percent?.toString() || '0',
          savings: metadata.savings?.toString() || '0'
        }),
        ...(paymentType === 'split' && { 
          upfrontPercent: metadata.upfront_percent?.toString() || '0',
          remainingAmount: metadata.remaining_amount?.toString() || '0'
        })
      },
      customer_email: serviceRequest.clients.email,
      payment_intent_data: {
        metadata: {
          paymentId: paymentId,
          requestId: serviceRequest.id,
          paymentType: paymentType
        }
      }
    })

    return session.url
  } catch (error) {
    console.error("Stripe checkout creation failed:", error)
    throw new Error("Failed to create Stripe checkout session")
  }
}

async function createPaystackCheckout(
  paymentId: string, 
  amount: number, 
  serviceRequest: any, 
  paymentType: string,
  metadata: any
) {
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      console.error("Paystack secret key not configured")
      throw new Error("Payment configuration error")
    }

    const paymentDescription = paymentType === "split" 
      ? `${metadata.description} (${metadata.upfront_percent}% upfront)`
      : `${metadata.description} (${metadata.discount_percent}% discount applied)`

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: serviceRequest.clients.email,
        amount: Math.round(amount * 100), // Paystack uses kobo for NGN, but since we're using USD, multiply by 100
        currency: 'USD',
        reference: `KE_${paymentType}_${paymentId}_${Date.now()}`,
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?payment_id=${paymentId}&type=${paymentType}`,
        metadata: {
          paymentId: paymentId,
          requestId: serviceRequest.id,
          clientName: serviceRequest.clients.name,
          serviceTitle: serviceRequest.title,
          paymentType: paymentType,
          originalAmount: metadata.original_amount,
          ...(paymentType === 'full' && {
            discountPercent: metadata.discount_percent,
            savings: metadata.savings,
            description: `Full payment with ${metadata.discount_percent}% discount`
          }),
          ...(paymentType === 'split' && {
            upfrontPercent: metadata.upfront_percent,
            remainingAmount: metadata.remaining_amount,
            description: `${metadata.upfront_percent}% upfront payment`
          })
        },
        channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer']
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Paystack API error:", errorData)
      throw new Error("Failed to initialize Paystack transaction")
    }

    const data = await response.json()
    
    if (!data.status || !data.data.authorization_url) {
      throw new Error("Invalid response from Paystack")
    }

    return data.data.authorization_url
  } catch (error) {
    console.error("Paystack checkout creation failed:", error)
    throw new Error("Failed to create Paystack checkout session")
  }
}

async function sendBankTransferInstructions(
  email: string, 
  paymentId: string, 
  amount: number, 
  paymentType: string,
  metadata: any
) {
  try {
    console.log("Sending bank transfer instructions to:", email, "for payment:", paymentId)
    
    const paymentTypeDescription = paymentType === "split" 
      ? `${metadata.upfront_percent}% upfront payment (${metadata.remaining_amount} remaining on completion)`
      : `Full payment with ${metadata.discount_percent}% discount (save ${metadata.savings})`

    const instructions = {
      bankName: "First Bank of Nigeria",
      accountNumber: "1234567890",
      accountName: "Kamisoft Enterprises",
      amount: amount,
      reference: `KE_BANK_${paymentType.toUpperCase()}_${paymentId}`,
      paymentType: paymentTypeDescription,
      originalAmount: metadata.original_amount,
      instructions: [
        "Transfer the exact amount to the account details provided",
        "Use the reference number in your transfer description",
        "Send proof of payment to hello@kamisoftenterprises.online",
        "Payment will be verified within 24 hours",
        paymentType === 'full' 
          ? `You're saving ${metadata.savings} with full payment!`
          : `Remaining ${metadata.remaining_amount} due upon project completion`
      ]
    }
    
    // TODO: Implement actual email sending with enhanced payment type info
    // await sendEmail({
    //   to: email,
    //   subject: `Bank Transfer Instructions - ${paymentType === 'split' ? 'Split' : 'Full'} Payment ${paymentId}`,
    //   template: 'bank-transfer-instructions',
    //   data: instructions
    // })
    
    console.log("Bank transfer instructions:", instructions)
  } catch (error) {
    console.error("Failed to send bank transfer instructions:", error)
    throw new Error("Failed to send payment instructions")
  }
}