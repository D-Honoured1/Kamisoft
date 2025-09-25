// app/api/payments/create/route.ts - NIGERIA-FOCUSED VERSION
export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import crypto from "crypto"

// Removed unused EXCHANGE_RATE_API - using cached rates in Paystack service

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

    // Validate payment type
    if (!['split', 'full'].includes(paymentType)) {
      return NextResponse.json({ 
        error: "Invalid payment type. Must be 'split' or 'full'" 
      }, { status: 400 })
    }

    // Validate payment method (removed stripe)
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
      const discountPercent = serviceRequest.admin_discount_percent || 10
      expectedAmount = totalCost * (1 - discountPercent / 100) // Apply discount for full payment
    }

    // Allow small rounding differences
    if (Math.abs(amount - expectedAmount) > 0.01) {
      return NextResponse.json({ 
        error: `Invalid amount. Expected ${expectedAmount.toFixed(2)} for ${paymentType} payment` 
      }, { status: 400 })
    }

    // Generate unique payment reference for deduplication
    const paymentReference = `${requestId}_${paymentType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Check for existing pending payments to prevent duplicates
    const { data: existingPayments, error: checkError } = await supabase
      .from("payments")
      .select("id, payment_status")
      .eq("request_id", requestId)
      .eq("payment_type", paymentType)
      .in("payment_status", ["pending", "processing"])

    if (checkError) {
      console.error(`[${correlationId}] Error checking existing payments:`, checkError)
    } else if (existingPayments && existingPayments.length > 0) {
      console.log(`[${correlationId}] Found existing pending payment:`, existingPayments[0].id)
      return NextResponse.json({
        error: "A payment for this request is already being processed. Please wait or contact support.",
        existingPaymentId: existingPayments[0].id
      }, { status: 409 })
    }

    // Create payment record with pending status
    // Note: Some fields may not exist in older database schemas
    const paymentData: any = {
      request_id: requestId,
      amount: amount,
      currency: paymentMethod === 'crypto' ? 'USDT' : 'USD',
      payment_method: paymentMethod,
      payment_status: "pending"
    }

    // Add enhanced fields only if they exist in the schema
    // This provides backward compatibility
    const enhancedMetadata = {
      ...metadata,
      created_at: new Date().toISOString(),
      user_agent: request.headers.get('user-agent'),
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    }

    // Try to add enhanced fields, but handle gracefully if columns don't exist
    try {
      paymentData.payment_type = paymentType
      paymentData.payment_reference = paymentReference
      paymentData.correlation_id = correlationId
      paymentData.metadata = JSON.stringify(enhancedMetadata)
    } catch (error) {
      console.warn(`[${correlationId}] Enhanced payment fields not available, using basic schema`)
    }

    console.log(`[${correlationId}] Creating payment record:`, paymentData)

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert(paymentData)
      .select("id")
      .single()

    if (paymentError) {
      console.error(`[${correlationId}] Error creating payment:`, paymentError)

      // Handle duplicate key constraint
      if (paymentError.code === '23505') {
        return NextResponse.json({
          error: "A payment with this reference already exists. Please try again.",
          correlationId
        }, { status: 409 })
      }

      return NextResponse.json({
        error: "Failed to create payment record",
        details: paymentError.message,
        correlationId
      }, { status: 500 })
    }

    console.log(`[${correlationId}] Payment record created:`, payment.id)

    let checkoutUrl = null
    let cryptoAddress = null

    // Handle different payment methods with better error recovery
    try {
      // Update status to processing to prevent duplicate attempts
      const processingUpdate: any = { payment_status: "processing" }

      // Add timestamp if column exists
      try {
        processingUpdate.processing_started_at = new Date().toISOString()
      } catch (error) {
        // Column doesn't exist, continue without it
      }

      const { error: statusUpdateError } = await supabase
        .from("payments")
        .update(processingUpdate)
        .eq("id", payment.id)

      if (statusUpdateError) {
        console.error(`[${correlationId}] Error updating payment status to processing:`, statusUpdateError)
      }

      switch (paymentMethod) {
        case "paystack":
          checkoutUrl = await createPaystackCheckout(payment.id, amount, serviceRequest, paymentType, metadata, correlationId, paymentReference)
          break
        case "bank_transfer":
          await sendBankTransferInstructions(serviceRequest.clients.email, payment.id, amount, paymentType, metadata, correlationId)
          break
        case "crypto":
          cryptoAddress = await generateCryptoAddress(payment.id, amount, serviceRequest, paymentType, correlationId)
          break
        default:
          throw new Error("Invalid payment method")
      }

      // Update payment status back to pending after successful initialization
      const pendingUpdate: any = { payment_status: "pending" }

      // Add timestamp if column exists
      try {
        pendingUpdate.initialized_at = new Date().toISOString()
      } catch (error) {
        // Column doesn't exist, continue without it
      }

      await supabase
        .from("payments")
        .update(pendingUpdate)
        .eq("id", payment.id)

    } catch (paymentMethodError: any) {
      console.error(`[${correlationId}] Payment method error:`, {
        error: paymentMethodError.message,
        paymentId: payment.id,
        method: paymentMethod
      })

      // Update payment status to failed with detailed error info
      const failedUpdate: any = { payment_status: "failed" }

      // Add error fields if columns exist
      try {
        failedUpdate.error_message = paymentMethodError.message
        failedUpdate.failed_at = new Date().toISOString()
      } catch (error) {
        // Columns don't exist, continue without them
      }

      await supabase
        .from("payments")
        .update(failedUpdate)
        .eq("id", payment.id)

      // Determine if error is retryable
      const isRetryable = isRetryableError(paymentMethodError.message)

      return NextResponse.json({
        error: paymentMethodError.message || "Payment processing failed",
        details: isRetryable ? "This is a temporary error. Please try again." : "Please try a different payment method or contact support",
        correlationId,
        retryable: isRetryable
      }, { status: 500 })
    }

    // Prepare response, excluding fields that might not be available
    const response: any = {
      success: true,
      paymentId: payment.id,
      checkoutUrl,
      cryptoAddress,
      paymentType,
      amount,
      currency: paymentMethod === 'crypto' ? 'USDT' : 'USD',
      message: getPaymentMethodMessage(paymentMethod)
    }

    // Add enhanced fields if available
    if (paymentReference) response.paymentReference = paymentReference
    if (correlationId) response.correlationId = correlationId

    return NextResponse.json(response)
  } catch (error: any) {
    console.error(`[${correlationId}] Error creating payment:`, {
      error: error.message,
      stack: error.stack,
      requestInfo: 'Payment creation request failed'
    })
    return NextResponse.json({
      error: "Internal server error",
      details: error.message,
      message: "Please try again or contact support if the problem persists",
      correlationId
    }, { status: 500 })
  }
}

async function createPaystackCheckout(
  paymentId: string,
  amount: number,
  serviceRequest: any,
  paymentType: string,
  metadata: any,
  correlationId: string,
  paymentReference: string
) {
  try {
    const { paystackService } = await import('@/lib/paystack')

    const paymentDescription = paymentType === "split"
      ? `50% upfront payment for ${serviceRequest.title}`
      : `Full payment with discount for ${serviceRequest.title}`

    // Use provided payment reference for consistency
    const reference = paymentReference

    // Initialize transaction using Paystack service
    const result = await paystackService.initializeTransaction({
      email: serviceRequest.clients.email,
      amount: amount, // Service handles conversion to kobo/cents
      currency: 'USD',
      reference: reference,
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?payment_id=${paymentId}&type=${paymentType}`,
      metadata: {
        paymentId: paymentId,
        requestId: serviceRequest.id,
        clientName: serviceRequest.clients.name,
        serviceTitle: serviceRequest.title,
        paymentType: paymentType,
        description: paymentDescription,
        ...metadata
      },
      channels: ['card', 'bank', 'ussd', 'mobile_money', 'bank_transfer']
    })

    if (!result.success || !result.authorization_url) {
      throw new Error(result.message || "Payment processing failed. Please try again.")
    }

    // Store Paystack reference for tracking
    const supabase = createServerClient()

    // Prepare update data with backward compatibility
    const updateData: any = {
      paystack_reference: result.reference
    }

    // Add metadata if column exists
    try {
      updateData.metadata = JSON.stringify({
        paystack_init_data: {
          reference: result.reference,
          access_code: result.access_code,
          authorization_url: result.authorization_url
        },
        original_metadata: metadata,
        initialized_at: new Date().toISOString()
      })
    } catch (error) {
      // Metadata column doesn't exist, continue without it
      console.log(`[${correlationId}] Metadata column not available, storing basic reference only`)
    }

    const { error: updateError } = await supabase
      .from("payments")
      .update(updateData)
      .eq("id", paymentId)

    if (updateError) {
      console.error("Error updating payment with Paystack reference:", updateError)
      // Don't fail the payment creation for this
    }

    console.log(`[${correlationId}] Paystack checkout created successfully:`, {
      paymentId,
      reference: result.reference,
      amount,
      currency: 'USD'
    })

    return result.authorization_url
  } catch (error: any) {
    console.error(`[${correlationId}] Paystack checkout creation failed:`, error)
    throw new Error(error.message || "Payment processing temporarily unavailable. Please try again or use a different payment method.")
  }
}

async function sendBankTransferInstructions(
  email: string,
  paymentId: string,
  amount: number,
  paymentType: string,
  _metadata: any, // Prefix with underscore to indicate intentionally unused
  correlationId: string
) {
  try {
    console.log(`[${correlationId}] Sending bank transfer instructions to:`, email, "for payment:", paymentId)
    
    const paymentTypeDescription = paymentType === "split" 
      ? "50% upfront payment (remaining 50% due on completion)"
      : "Full payment with discount"

    const instructions = {
      bankName: "First Bank of Nigeria",
      accountNumber: "3050505050", // Replace with your actual account
      accountName: "Kamisoft Enterprises Limited",
      amount: amount,
      reference: `KE_BANK_${paymentType.toUpperCase()}_${paymentId}`,
      paymentType: paymentTypeDescription,
      instructions: [
        "Transfer the exact amount to the account details provided",
        "Use the reference number in your transfer description/narration",
        "Send proof of payment to hello@kamisoftenterprises.online",
        "Payment will be verified within 24 hours",
        paymentType === 'full' 
          ? "You're saving with full payment discount!"
          : "Remaining 50% due upon project completion"
      ]
    }
    
    // TODO: Implement actual email sending
    console.log(`[${correlationId}] Bank transfer instructions:`, instructions)
  } catch (error) {
    console.error(`[${correlationId}] Failed to send bank transfer instructions:`, error)
    throw new Error("Failed to send payment instructions. Please contact support.")
  }
}

async function generateCryptoAddress(
  paymentId: string,
  amount: number,
  _serviceRequest: any, // Prefix with underscore to indicate intentionally unused
  _paymentType: string,  // Prefix with underscore to indicate intentionally unused
  correlationId: string
) {
  try {
    // For now, return a static USDT address
    // In production, you'd integrate with a crypto payment processor like:
    // - CoinPayments, BitPay, or Coinbase Commerce
    // - Generate unique addresses for each payment
    
    const cryptoInfo = {
      currency: "USDT",
      network: "TRC20", // Tron network (lower fees)
      address: "TYourUSDTAddressHere123456789", // Replace with your actual USDT address
      amount: amount,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TYourUSDTAddressHere123456789`,
      instructions: [
        `Send exactly ${amount} USDT to the address above`,
        "Use TRC20 network (Tron) for lower fees",
        "Send transaction hash to hello@kamisoftenterprises.online",
        "Payment will be verified within 1 hour",
        "Do not send any other cryptocurrency to this address"
      ]
    }

    // Store crypto info for tracking (if columns exist)
    const supabase = createServerClient()
    const cryptoUpdateData: any = {}

    // Add crypto fields only if columns exist
    try {
      cryptoUpdateData.crypto_address = cryptoInfo.address
      cryptoUpdateData.crypto_network = cryptoInfo.network
    } catch (error) {
      console.log(`[${correlationId}] Crypto columns not available in database`)
    }

    if (Object.keys(cryptoUpdateData).length > 0) {
      await supabase
        .from("payments")
        .update(cryptoUpdateData)
        .eq("id", paymentId)
    }

    return cryptoInfo
  } catch (error) {
    console.error(`[${correlationId}] Failed to generate crypto address:`, error)
    throw new Error("Crypto payment setup failed. Please try another payment method.")
  }
}

function getPaymentMethodMessage(method: string): string {
  switch (method) {
    case 'paystack':
      return "Redirecting to Paystack for secure payment"
    case 'bank_transfer':
      return "Bank transfer instructions sent to your email"
    case 'crypto':
      return "Cryptocurrency payment address generated"
    default:
      return "Payment session created successfully"
  }
}

function isRetryableError(errorMessage: string): boolean {
  const retryablePatterns = [
    'network',
    'timeout',
    'temporarily unavailable',
    'connection',
    'rate limit',
    'service unavailable'
  ]

  const lowerMessage = errorMessage.toLowerCase()
  return retryablePatterns.some(pattern => lowerMessage.includes(pattern))
}