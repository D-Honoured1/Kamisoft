// app/api/payments/create/route.ts
export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { requestId, paymentMethod, amount } = await request.json()

    // Validate input
    if (!requestId || !paymentMethod || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get service request details
    const { data: serviceRequest, error: requestError } = await supabase
      .from("service_requests")
      .select(`
        *,
        client:clients(*)
      `)
      .eq("id", requestId)
      .single()

    if (requestError || !serviceRequest) {
      return NextResponse.json({ error: "Service request not found" }, { status: 404 })
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        request_id: requestId,
        amount: amount,
        currency: "USD",
        payment_method: paymentMethod,
        payment_status: "pending",
      })
      .select("id")
      .single()

    if (paymentError) {
      console.error("Error creating payment:", paymentError)
      return NextResponse.json({ error: "Failed to create payment record" }, { status: 500 })
    }

    let checkoutUrl = null

    // Handle different payment methods
    switch (paymentMethod) {
      case "stripe":
        checkoutUrl = await createStripeCheckout(payment.id, amount, serviceRequest)
        break
      case "paystack":
        checkoutUrl = await createPaystackCheckout(payment.id, amount, serviceRequest)
        break
      case "bank_transfer":
        // Send bank transfer instructions via email
        await sendBankTransferInstructions(serviceRequest.client.email, payment.id, amount)
        break
      case "crypto":
        return NextResponse.json({ error: "Cryptocurrency payments not yet supported" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      checkoutUrl,
      message:
        paymentMethod === "bank_transfer"
          ? "Bank transfer instructions sent to your email"
          : "Payment session created successfully",
    })
  } catch (error) {
    console.error("Error creating payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function createStripeCheckout(paymentId: string, amount: number, serviceRequest: any) {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
    
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("Stripe secret key not configured")
      throw new Error("Payment configuration error")
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: serviceRequest.title,
            description: `Service request for ${serviceRequest.client.name}`,
          },
          unit_amount: Math.round(amount * 100), // Stripe uses cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?payment_id=${paymentId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancelled?payment_id=${paymentId}`,
      metadata: {
        paymentId: paymentId,
        requestId: serviceRequest.id,
        clientEmail: serviceRequest.client.email
      },
      customer_email: serviceRequest.client.email,
    })

    return session.url
  } catch (error) {
    console.error("Stripe checkout creation failed:", error)
    throw new Error("Failed to create Stripe checkout session")
  }
}

async function createPaystackCheckout(paymentId: string, amount: number, serviceRequest: any) {
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      console.error("Paystack secret key not configured")
      throw new Error("Payment configuration error")
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: serviceRequest.client.email,
        amount: Math.round(amount * 100), // Paystack uses kobo for NGN, but since we're using USD, multiply by 100
        currency: 'USD',
        reference: `KE_${paymentId}_${Date.now()}`,
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?payment_id=${paymentId}`,
        metadata: {
          paymentId: paymentId,
          requestId: serviceRequest.id,
          clientName: serviceRequest.client.name,
          serviceTitle: serviceRequest.title
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

async function sendBankTransferInstructions(email: string, paymentId: string, amount: number) {
  try {
    // This would typically use an email service like SendGrid, Resend, or similar
    console.log("Sending bank transfer instructions to:", email, "for payment:", paymentId)
    
    // For now, we'll just log the instructions
    // In a real implementation, you would send an email with:
    const instructions = {
      bankName: "First Bank of Nigeria",
      accountNumber: "1234567890",
      accountName: "Kamisoft Enterprises",
      amount: amount,
      reference: `KE_BANK_${paymentId}`,
      instructions: [
        "Transfer the exact amount to the account details provided",
        "Use the reference number in your transfer description",
        "Send proof of payment to hello@kamisoft.com",
        "Payment will be verified within 24 hours"
      ]
    }
    
    // TODO: Implement actual email sending
    // await sendEmail({
    //   to: email,
    //   subject: `Bank Transfer Instructions - Payment ${paymentId}`,
    //   template: 'bank-transfer-instructions',
    //   data: instructions
    // })
    
    console.log("Bank transfer instructions:", instructions)
  } catch (error) {
    console.error("Failed to send bank transfer instructions:", error)
    throw new Error("Failed to send payment instructions")
  }
}