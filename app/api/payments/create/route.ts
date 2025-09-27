// app/api/payments/create/route.ts - REPLACE ENTIRE FILE WITH THIS
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

    const validPaymentMethods = ['paystack', 'bank_transfer', 'nowpayments']
    if (!validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json({
        error: "Invalid payment method. Supported: paystack, bank_transfer, nowpayments"
      }, { status: 400 })
    }

    // Get service request details
    const { data: serviceRequest, error: requestError } = await supabase
      .from("service_requests")
      .select(`*, clients (*)`)
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

    // Get existing completed payments to calculate remaining balance
    const { data: existingCompletedPayments } = await supabase
      .from("payments")
      .select("amount, payment_status")
      .eq("request_id", requestId)
      .eq("payment_status", "completed")

    const totalPaid = existingCompletedPayments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
    const totalCost = serviceRequest.estimated_cost || 0
    const remainingBalance = totalCost - totalPaid

    // Validate payment amount
    let expectedAmount: number
    let paymentSequence = 1
    let isPartialPayment = false

    if (paymentType === "split") {
      isPartialPayment = true
      // Check if this is the first or second payment
      const completedSplitPayments = existingCompletedPayments?.filter(p => p.payment_status === "completed").length || 0

      if (completedSplitPayments === 0) {
        // First payment (50%)
        expectedAmount = totalCost * 0.5
        paymentSequence = 1
      } else if (completedSplitPayments === 1) {
        // Second payment (remaining balance)
        expectedAmount = remainingBalance
        paymentSequence = 2
      } else {
        return NextResponse.json({
          error: "All split payments have already been completed for this request"
        }, { status: 400 })
      }
    } else {
      // Full payment
      if (totalPaid > 0) {
        return NextResponse.json({
          error: `Payment already exists. Remaining balance: $${remainingBalance.toFixed(2)}`
        }, { status: 400 })
      }
      expectedAmount = totalCost
      paymentSequence = 1
    }

    if (Math.abs(amount - expectedAmount) > 0.01) {
      return NextResponse.json({
        error: `Invalid amount. Expected $${expectedAmount.toFixed(2)} for ${paymentType} payment (sequence ${paymentSequence})`
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

    // Create payment record - Store USD amount for business consistency
    const paymentData = {
      request_id: requestId,
      amount: amount, // Store USD amount in database
      currency: 'USD', // Your business currency
      payment_method: paymentMethod,
      payment_status: "pending",
      payment_type: paymentType,
      payment_sequence: paymentSequence,
      is_partial_payment: isPartialPayment,
      total_amount_due: totalCost,
      payment_reference: paymentReference,
      metadata: JSON.stringify({
        ...metadata,
        business_currency: 'USD',
        business_amount: amount,
        payment_sequence: paymentSequence,
        is_partial_payment: isPartialPayment,
        total_amount_due: totalCost,
        remaining_balance_before: remainingBalance,
        note: 'USD amount converted to NGN for Paystack processing',
        created_at: new Date().toISOString()
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
        details: paymentError.message,
        correlationId
      }, { status: 500 })
    }

    console.log(`[${correlationId}] Payment record created:`, payment.id)

    // Update service request payment plan if this is a split payment
    if (paymentType === "split" && paymentSequence === 1) {
      const { error: updateError } = await supabase
        .from("service_requests")
        .update({
          payment_plan: "split",
          updated_at: new Date().toISOString()
        })
        .eq("id", requestId)

      if (updateError) {
        console.warn(`[${correlationId}] Failed to update service request payment plan:`, updateError)
      }
    }

    // Handle payment method
    let result = null
    try {
      switch (paymentMethod) {
        case "paystack":
          result = await createPaystackCheckout(payment.id, amount, serviceRequest, paymentType, paymentReference, correlationId)
          break
        case "bank_transfer":
          result = await createBankTransferInstructions(payment.id, amount, correlationId)
          break
        case "nowpayments":
          result = await createCryptoPayment(payment.id, amount, correlationId)
          break
      }
    } catch (error: any) {
      console.error(`[${correlationId}] Payment method error:`, error)
      
      await supabase
        .from("payments")
        .update({ 
          payment_status: "failed", 
          error_message: error.message 
        })
        .eq("id", payment.id)

      return NextResponse.json({
        error: error.message || "Payment processing failed",
        correlationId
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      paymentReference,
      // Return both currencies for frontend display
      displayAmount: amount, // USD (what customer sees as price)
      displayCurrency: 'USD',
      paymentAmount: result?.ngnAmount, // NGN (what they actually pay)
      paymentCurrency: 'NGN',
      exchangeRate: result?.exchangeRate,
      correlationId,
      ...result
    })

  } catch (error: any) {
    console.error(`[${correlationId}] Payment creation error:`, error)
    return NextResponse.json({
      error: "Internal server error",
      details: error.message,
      correlationId
    }, { status: 500 })
  }
}

async function createPaystackCheckout(
  paymentId: string,
  usdAmount: number,
  serviceRequest: any,
  paymentType: string,
  paymentReference: string,
  correlationId: string
) {
  try {
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecretKey) {
      throw new Error("Paystack secret key not configured")
    }

    console.log(`[${correlationId}] Converting $${usdAmount} USD to NGN for Paystack`)

    // Step 1: Get current USD to NGN exchange rate from environment-configured source
    const fallbackRate = parseFloat(process.env.EXCHANGE_RATE_FALLBACK_USD_TO_NGN || '1550')
    let exchangeRate = fallbackRate

    try {
      // Use a reliable exchange rate API with optional API key
      const apiKey = process.env.EXCHANGE_RATE_API_KEY
      const apiUrl = apiKey
        ? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`
        : 'https://api.exchangerate-api.com/v4/latest/USD'

      const response = await fetch(apiUrl, {
        signal: AbortSignal.timeout(5000)
      })

      if (response.ok) {
        const data = await response.json()
        const ngnRate = data.conversion_rates?.NGN || data.rates?.NGN
        if (ngnRate) {
          exchangeRate = ngnRate
          console.log(`[${correlationId}] ✅ Current rate: 1 USD = ${exchangeRate} NGN (API: ${apiKey ? 'authenticated' : 'free'})`)
        }
      }
    } catch (rateError) {
      console.log(`[${correlationId}] ⚠️ Exchange rate API failed, using environment fallback rate: ${exchangeRate}`)
    }

    // Step 2: Convert USD to NGN
    const ngnAmount = Math.round(usdAmount * exchangeRate)
    console.log(`[${correlationId}] Conversion: $${usdAmount} USD = ₦${ngnAmount.toLocaleString()} NGN`)

    // Step 3: Send NGN amount to Paystack
    const paymentDescription = paymentType === "split"
      ? `50% upfront payment for ${serviceRequest.title} ($${usdAmount} USD)`
      : `Full payment for ${serviceRequest.title} ($${usdAmount} USD)`

    const requestData = {
      email: serviceRequest.clients.email,
      amount: ngnAmount * 100, // Convert NGN to kobo
      currency: 'NGN', // This is what your Paystack account accepts
      reference: paymentReference,
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?payment_id=${paymentId}&type=${paymentType}`,
      metadata: {
        paymentId,
        requestId: serviceRequest.id,
        clientName: serviceRequest.clients.name,
        serviceTitle: serviceRequest.title,
        paymentType,
        description: paymentDescription,
        // Keep track of original USD amount
        original_amount_usd: usdAmount,
        ngn_amount: ngnAmount,
        exchange_rate: exchangeRate,
        conversion_timestamp: new Date().toISOString()
      },
      channels: ['card', 'bank', 'ussd', 'mobile_money', 'bank_transfer']
    }

    console.log(`[${correlationId}] Sending to Paystack:`, {
      amount: `₦${ngnAmount.toLocaleString()}`,
      amountInKobo: requestData.amount,
      currency: requestData.currency,
      originalUSD: usdAmount
    })

    // Step 4: Call Paystack API
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    })

    const responseData = await response.json()

    if (!response.ok || !responseData.status) {
      throw new Error(responseData.message || "Paystack initialization failed")
    }

    console.log(`[${correlationId}] ✅ Paystack accepted NGN payment`)

    // Step 5: Update payment record with conversion details
    const supabase = createServerClient()
    await supabase
      .from("payments")
      .update({
        paystack_reference: responseData.data.reference,
        metadata: JSON.stringify({
          paystack_data: responseData.data,
          original_amount_usd: usdAmount,
          charged_amount_ngn: ngnAmount,
          exchange_rate: exchangeRate,
          conversion_method: 'pre_conversion',
          display_currency: 'USD',
          payment_currency: 'NGN'
        })
      })
      .eq("id", paymentId)

    return {
      checkoutUrl: responseData.data.authorization_url,
      message: `Pay ₦${ngnAmount.toLocaleString()} (${usdAmount} USD equivalent)`,
      usdAmount: usdAmount,
      ngnAmount: ngnAmount,
      exchangeRate: exchangeRate
    }

  } catch (error: any) {
    console.error(`[${correlationId}] Paystack error:`, error)
    throw new Error(error.message || "Payment processing failed")
  }
}

async function createBankTransferInstructions(
  paymentId: string,
  usdAmount: number,
  correlationId: string
) {
  try {
    // Get current exchange rate for bank transfer from environment-configured source
    const fallbackRate = parseFloat(process.env.EXCHANGE_RATE_FALLBACK_USD_TO_NGN || '1550')
    let exchangeRate = fallbackRate

    try {
      // Use the same API configuration as Paystack function
      const apiKey = process.env.EXCHANGE_RATE_API_KEY
      const apiUrl = apiKey
        ? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`
        : 'https://api.exchangerate-api.com/v4/latest/USD'

      const response = await fetch(apiUrl, {
        signal: AbortSignal.timeout(5000)
      })

      if (response.ok) {
        const data = await response.json()
        const ngnRate = data.conversion_rates?.NGN || data.rates?.NGN
        if (ngnRate) {
          exchangeRate = ngnRate
          console.log(`[${correlationId}] ✅ Bank transfer rate: 1 USD = ${exchangeRate} NGN`)
        }
      }
    } catch (error) {
      console.log(`[${correlationId}] ⚠️ Using environment fallback rate for bank transfer: ${exchangeRate}`)
    }

    const ngnAmount = Math.round(usdAmount * exchangeRate)

    const instructions = {
      bankName: "First Bank of Nigeria",
      accountNumber: "3050505050", 
      accountName: "Kamisoft Enterprises Limited",
      usdAmount: usdAmount,
      ngnAmount: ngnAmount,
      exchangeRate: exchangeRate,
      reference: `KE_BANK_${paymentId.slice(0, 8)}`,
      instructions: [
        `Transfer ₦${ngnAmount.toLocaleString()} NGN (equivalent to $${usdAmount} USD)`,
        `Exchange rate: 1 USD = ₦${exchangeRate}`,
        "Use the reference number in your transfer description", 
        "Send proof of payment to hello@kamisoftenterprises.online",
        "Payment will be verified within 24 hours"
      ]
    }

    return {
      bankDetails: instructions,
      message: "Bank transfer instructions generated",
      ngnAmount: ngnAmount,
      exchangeRate: exchangeRate
    }
  } catch (error: any) {
    console.error(`[${correlationId}] Bank transfer error:`, error)
    throw new Error("Failed to generate bank transfer instructions")
  }
}

async function createCryptoPayment(
  paymentId: string,
  usdAmount: number,
  correlationId: string
) {
  try {
    // This function should redirect to NOWPayments for proper crypto handling
    console.log(`[${correlationId}] Redirecting crypto payment to NOWPayments integration`)

    return {
      cryptoInfo: {
        currency: "USDT",
        network: "TRC20",
        amount: usdAmount,
        message: "Please use the NOWPayments integration for secure crypto payments",
        redirectToNowPayments: true
      },
      message: "Crypto payment should use NOWPayments integration"
    }
  } catch (error: any) {
    console.error(`[${correlationId}] Crypto payment error:`, error)
    throw new Error("Failed to generate crypto payment - use NOWPayments integration")
  }
}