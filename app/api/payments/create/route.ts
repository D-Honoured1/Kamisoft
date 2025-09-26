// app/api/payments/create/route.ts - FIXED USD PAYSTACK VERSION
export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  const correlationId = crypto.randomUUID()

  try {
    const supabase = createServerClient()
    const { requestId, paymentMethod, amount, paymentType, metadata } = await request.json()

    console.log(`[${correlationId}] Payment creation request:`, { requestId, paymentMethod, amount, paymentType })

    // Validate input
    if (!requestId || !paymentMethod || !amount || !paymentType) {
      return NextResponse.json({ 
        error: "Missing required fields: requestId, paymentMethod, amount, paymentType" 
      }, { status: 400 })
    }

    if (!['split', 'full'].includes(paymentType)) {
      return NextResponse.json({ 
        error: "Invalid payment type. Must be 'split' or 'full'" 
      }, { status: 400 })
    }

    const validPaymentMethods = ['paystack', 'bank_transfer', 'crypto']
    if (!validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json({ 
        error: "Invalid payment method. Supported: paystack, bank_transfer, crypto" 
      }, { status: 400 })
    }

    // Get service request details
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

    if (serviceRequest.status !== "approved") {
      return NextResponse.json({ 
        error: "Payment not allowed. Request must be approved first." 
      }, { status: 400 })
    }

    // Validate payment amount
    const totalCost = serviceRequest.estimated_cost || 0
    let expectedAmount: number

    if (paymentType === "split") {
      expectedAmount = totalCost * 0.5
    } else {
      const discountPercent = serviceRequest.admin_discount_percent || 10
      expectedAmount = totalCost * (1 - discountPercent / 100)
    }

    if (Math.abs(amount - expectedAmount) > 0.01) {
      return NextResponse.json({ 
        error: `Invalid amount. Expected ${expectedAmount.toFixed(2)} for ${paymentType} payment` 
      }, { status: 400 })
    }

    // Generate unique payment reference
    const paymentReference = `KE_${paymentType.toUpperCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Check for existing pending payments
    const { data: existingPayments } = await supabase
      .from("payments")
      .select("id, payment_status")
      .eq("request_id", requestId)
      .eq("payment_type", paymentType)
      .in("payment_status", ["pending", "processing"])

    if (existingPayments && existingPayments.length > 0) {
      return NextResponse.json({
        error: "A payment for this request is already being processed.",
        existingPaymentId: existingPayments[0].id
      }, { status: 409 })
    }

    // Create payment record
    const paymentData: any = {
      request_id: requestId,
      amount: amount,
      currency: 'USD', // Keep as USD
      payment_method: paymentMethod,
      payment_status: "pending",
      payment_type: paymentType,
      payment_reference: paymentReference,
      correlation_id: correlationId,
      metadata: JSON.stringify({
        ...metadata,
        created_at: new Date().toISOString(),
        user_agent: request.headers.get('user-agent'),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      })
    }

    console.log(`[${correlationId}] Creating payment record:`, paymentData)

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert(paymentData)
      .select("id")
      .single()

    if (paymentError) {
      console.error(`[${correlationId}] Error creating payment:`, paymentError)
      return NextResponse.json({
        error: "Failed to create payment record",
        details: paymentError.message
      }, { status: 500 })
    }

    console.log(`[${correlationId}] Payment record created:`, payment.id)

    let result = null

    // Handle different payment methods
    try {
      switch (paymentMethod) {
        case "paystack":
          result = await createPaystackCheckout(payment.id, amount, serviceRequest, paymentType, paymentReference, correlationId)
          break
        case "bank_transfer":
          result = await createBankTransferInstructions(payment.id, amount, serviceRequest, paymentType, correlationId)
          break
        case "crypto":
          result = await createCryptoPayment(payment.id, amount, serviceRequest, paymentType, correlationId)
          break
        default:
          throw new Error("Invalid payment method")
      }

      // Update payment status to pending
      await supabase
        .from("payments")
        .update({ payment_status: "pending" })
        .eq("id", payment.id)

    } catch (paymentMethodError: any) {
      console.error(`[${correlationId}] Payment method error:`, paymentMethodError)

      // Update payment as failed
      await supabase
        .from("payments")
        .update({ 
          payment_status: "failed",
          error_message: paymentMethodError.message
        })
        .eq("id", payment.id)

      return NextResponse.json({
        error: paymentMethodError.message || "Payment processing failed",
        correlationId
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      paymentReference,
      correlationId,
      ...result
    })

  } catch (error: any) {
    console.error(`[${correlationId}] Error creating payment:`, error)
    return NextResponse.json({
      error: "Internal server error",
      details: error.message,
      correlationId
    }, { status: 500 })
  }
}

// Simplified Paystack checkout creation that sends USD directly
async function createPaystackCheckout(
  paymentId: string,
  amount: number,
  serviceRequest: any,
  paymentType: string,
  paymentReference: string,
  correlationId: string
) {
  try {
    console.log(`[${correlationId}] Creating Paystack checkout for USD amount:`, amount)

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecretKey) {
      throw new Error("Paystack secret key not configured")
    }

    const paymentDescription = paymentType === "split"
      ? `50% upfront payment for ${serviceRequest.title}`
      : `Full payment with discount for ${serviceRequest.title}`

    // Create Paystack transaction - send USD directly to Paystack
    const requestData = {
      email: serviceRequest.clients.email,
      amount: Math.round(amount * 100), // Convert to cents (not kobo since we're using USD)
      currency: 'USD', // Explicitly set to USD
      reference: paymentReference,
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?payment_id=${paymentId}&type=${paymentType}`,
      metadata: {
        paymentId: paymentId,
        requestId: serviceRequest.id,
        clientName: serviceRequest.clients.name,
        serviceTitle: serviceRequest.title,
        paymentType: paymentType,
        description: paymentDescription,
        currency: 'USD'
      },
      channels: ['card', 'bank', 'ussd', 'mobile_money', 'bank_transfer']
    }

    console.log(`[${correlationId}] Paystack request:`, {
      email: requestData.email,
      amount: requestData.amount,
      currency: requestData.currency,
      reference: requestData.reference
    })

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    })

    const responseData = await response.json()

    console.log(`[${correlationId}] Paystack response:`, {
      status: responseData.status,
      message: responseData.message
    })

    if (!response.ok || !responseData.status) {
      throw new Error(responseData.message || `Paystack API error: ${response.status}`)
    }

    // Store Paystack reference
    const supabase = createServerClient()
    await supabase
      .from("payments")
      .update({
        paystack_reference: responseData.data.reference,
        metadata: JSON.stringify({
          paystack_data: responseData.data,
          original_amount: amount,
          currency: 'USD'
        })
      })
      .eq("id", paymentId)

    console.log(`[${correlationId}] Paystack checkout URL generated:`, responseData.data.authorization_url)

    return {
      checkoutUrl: responseData.data.authorization_url,
      amount: amount,
      currency: 'USD'
    }

  } catch (error: any) {
    console.error(`[${correlationId}] Paystack error:`, error)
    throw new Error(error.message || "Paystack payment processing failed")
  }
}

async function createBankTransferInstructions(
  paymentId: string,
  amount: number,
  serviceRequest: any,
  paymentType: string,
  correlationId: string
) {
  try {
    console.log(`[${correlationId}] Creating bank transfer instructions`)

    const instructions = {
      bankName: "First Bank of Nigeria",
      accountNumber: "3050505050",
      accountName: "Kamisoft Enterprises Limited",
      amount: amount,
      currency: "USD",
      reference: `KE_${paymentType.toUpperCase()}_${paymentId.slice(0, 8)}`,
      instructions: [
        `Transfer exactly $${amount.toFixed(2)} USD to the account above`,
        "Use the reference number in your transfer description",
        "Send proof of payment to hello@kamisoftenterprises.online",
        "Payment will be verified within 24 hours"
      ]
    }

    return {
      bankDetails: instructions,
      message: "Bank transfer instructions generated"
    }
  } catch (error: any) {
    console.error(`[${correlationId}] Bank transfer error:`, error)
    throw new Error("Failed to generate bank transfer instructions")
  }
}

async function createCryptoPayment(
  paymentId: string,
  amount: number,
  serviceRequest: any,
  paymentType: string,
  correlationId: string
) {
  try {
    console.log(`[${correlationId}] Creating crypto payment`)

    const cryptoInfo = {
      currency: "USDT",
      network: "TRC20",
      address: "TYourUSDTAddressHere123456789", // Replace with your actual address
      amount: amount,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TYourUSDTAddressHere123456789`,
      instructions: [
        `Send exactly ${amount} USDT to the address above`,
        "Use TRC20 network (Tron) for lower fees",
        "Send transaction hash to hello@kamisoftenterprises.online",
        "Payment will be verified within 1 hour"
      ]
    }

    return {
      cryptoInfo: cryptoInfo,
      message: "Crypto payment address generated"
    }
  } catch (error: any) {
    console.error(`[${correlationId}] Crypto payment error:`, error)
    throw new Error("Failed to generate crypto payment")
  }
}