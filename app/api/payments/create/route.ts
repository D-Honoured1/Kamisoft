// app/api/payments/create/route.ts - NIGERIA-FOCUSED VERSION
export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// Exchange rate API endpoint (you can replace with your preferred provider)
const EXCHANGE_RATE_API = "https://api.exchangerate-api.com/v4/latest/USD"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { requestId, paymentMethod, amount, paymentType, metadata } = await request.json()

    console.log("Payment creation request:", { requestId, paymentMethod, amount, paymentType })

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

    // Create payment record with pending status
    const paymentData = {
      request_id: requestId,
      amount: amount,
      currency: paymentMethod === 'crypto' ? 'USDT' : 'USD',
      payment_method: paymentMethod,
      payment_status: "pending",
      payment_type: paymentType,
      metadata: JSON.stringify(metadata)
    }

    console.log("Creating payment record:", paymentData)

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

    console.log("Payment record created:", payment.id)

    let checkoutUrl = null
    let cryptoAddress = null

    // Handle different payment methods
    try {
      switch (paymentMethod) {
        case "paystack":
          checkoutUrl = await createPaystackCheckout(payment.id, amount, serviceRequest, paymentType, metadata)
          break
        case "bank_transfer":
          await sendBankTransferInstructions(serviceRequest.clients.email, payment.id, amount, paymentType, metadata)
          break
        case "crypto":
          cryptoAddress = await generateCryptoAddress(payment.id, amount, serviceRequest, paymentType)
          break
        default:
          return NextResponse.json({ error: "Invalid payment method" }, { status: 400 })
      }
    } catch (paymentMethodError: any) {
      console.error("Payment method error:", paymentMethodError)
      
      // Update payment status to failed
      await supabase
        .from("payments")
        .update({ 
          payment_status: "failed",
          error_message: paymentMethodError.message 
        })
        .eq("id", payment.id)

      return NextResponse.json({ 
        error: paymentMethodError.message || "Payment processing failed",
        details: "Please try a different payment method or contact support"
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      checkoutUrl,
      cryptoAddress,
      paymentType,
      amount,
      currency: paymentMethod === 'crypto' ? 'USDT' : 'USD',
      message: getPaymentMethodMessage(paymentMethod),
    })
  } catch (error: any) {
    console.error("Error creating payment:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error.message,
      message: "Please try again or contact support if the problem persists"
    }, { status: 500 })
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
    const { paystackService } = await import('@/lib/paystack')

    const paymentDescription = paymentType === "split"
      ? `50% upfront payment for ${serviceRequest.title}`
      : `Full payment with discount for ${serviceRequest.title}`

    // Generate unique reference
    const reference = paystackService.generateReference(`KE_${paymentType.toUpperCase()}`)

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
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        paystack_reference: result.reference,
        metadata: JSON.stringify({
          paystack_init_data: {
            reference: result.reference,
            access_code: result.access_code,
            authorization_url: result.authorization_url
          },
          original_metadata: metadata,
          initialized_at: new Date().toISOString()
        })
      })
      .eq("id", paymentId)

    if (updateError) {
      console.error("Error updating payment with Paystack reference:", updateError)
      // Don't fail the payment creation for this
    }

    console.log("Paystack checkout created successfully:", {
      paymentId,
      reference: result.reference,
      amount,
      currency: 'USD'
    })

    return result.authorization_url
  } catch (error: any) {
    console.error("Paystack checkout creation failed:", error)
    throw new Error(error.message || "Payment processing temporarily unavailable. Please try again or use a different payment method.")
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
    console.log("Bank transfer instructions:", instructions)
  } catch (error) {
    console.error("Failed to send bank transfer instructions:", error)
    throw new Error("Failed to send payment instructions. Please contact support.")
  }
}

async function generateCryptoAddress(
  paymentId: string, 
  amount: number, 
  serviceRequest: any, 
  paymentType: string
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

    // Store crypto info for tracking
    const supabase = createServerClient()
    await supabase
      .from("payments")
      .update({ 
        crypto_address: cryptoInfo.address,
        crypto_network: cryptoInfo.network 
      })
      .eq("id", paymentId)

    return cryptoInfo
  } catch (error) {
    console.error("Failed to generate crypto address:", error)
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