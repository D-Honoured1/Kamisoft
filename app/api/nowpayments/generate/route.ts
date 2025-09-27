// app/api/nowpayments/generate/route.ts - Generate NOWPayments payment details
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { nowPaymentsService } from "@/lib/nowpayments"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  const correlationId = crypto.randomUUID()

  try {
    const supabase = createServerClient()
    const {
      paymentId,
      payCurrency,
      usdAmount,
      paymentReference
    } = await request.json()

    console.log(`[${correlationId}] NOWPayments generation request:`, {
      paymentId,
      payCurrency,
      usdAmount,
      paymentReference
    })

    // Validate required fields
    if (!paymentId || !payCurrency || !usdAmount || !paymentReference) {
      return NextResponse.json({
        error: "Missing required fields: paymentId, payCurrency, usdAmount, paymentReference"
      }, { status: 400 })
    }

    // Check if currency is supported
    const isSupported = await nowPaymentsService.isCurrencySupported(payCurrency)
    if (!isSupported) {
      return NextResponse.json({
        error: `Cryptocurrency ${payCurrency} is not supported`
      }, { status: 400 })
    }

    // Validate payment exists and is pending
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("id, payment_status, amount, request_id")
      .eq("id", paymentId)
      .single()

    if (paymentError || !payment) {
      console.error(`[${correlationId}] Payment not found:`, paymentError)
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    if (payment.payment_status !== 'pending') {
      return NextResponse.json({
        error: `Payment status is ${payment.payment_status}, expected pending`
      }, { status: 400 })
    }

    // Validate USD amount matches payment amount
    if (Math.abs(payment.amount - usdAmount) > 0.01) {
      return NextResponse.json({
        error: `Amount mismatch. Payment: $${payment.amount}, Requested: $${usdAmount}`
      }, { status: 400 })
    }

    // Generate crypto payment with NOWPayments
    try {
      const paymentDetails = await nowPaymentsService.generatePaymentDetails(
        usdAmount,
        payCurrency,
        paymentId, // order_id
        `Payment for $${usdAmount} - ${paymentReference}` // order_description
      )

      // Update payment record with NOWPayments details
      const { error: updateError } = await supabase
        .from("payments")
        .update({
          crypto_address: paymentDetails.payAddress,
          crypto_network: paymentDetails.network,
          crypto_amount: paymentDetails.payAmount,
          crypto_symbol: paymentDetails.payCurrency,
          metadata: JSON.stringify({
            nowpayments_payment_id: paymentDetails.paymentId,
            nowpayments_details: paymentDetails,
            generated_at: new Date().toISOString(),
            correlation_id: correlationId
          }),
          updated_at: new Date().toISOString()
        })
        .eq("id", paymentId)

      if (updateError) {
        console.error(`[${correlationId}] Error updating payment with NOWPayments details:`, updateError)
        return NextResponse.json({
          error: "Failed to save crypto payment details",
          details: updateError.message
        }, { status: 500 })
      }

      console.log(`[${correlationId}] NOWPayments payment generated successfully:`, {
        paymentId,
        nowpaymentsId: paymentDetails.paymentId,
        currency: paymentDetails.payCurrency,
        amount: `${paymentDetails.payAmount} ${paymentDetails.payCurrency}`,
        usdValue: `$${usdAmount}`,
        address: paymentDetails.payAddress.substring(0, 10) + '...'
      })

      return NextResponse.json({
        success: true,
        paymentId,
        cryptoDetails: {
          networkId: payCurrency.toLowerCase(),
          network: {
            id: payCurrency.toLowerCase(),
            name: `${paymentDetails.payCurrency} (${paymentDetails.network})`,
            symbol: paymentDetails.payCurrency,
            network: paymentDetails.network || 'Unknown'
          },
          address: paymentDetails.payAddress,
          amount: paymentDetails.payAmount,
          amountCrypto: paymentDetails.payAmount,
          usdAmount: paymentDetails.priceAmount,
          qrCodeUrl: paymentDetails.qrCodeUrl,
          paymentReference,
          expiresAt: paymentDetails.expiresAt,
          instructions: [
            `Send exactly ${paymentDetails.payAmount} ${paymentDetails.payCurrency} to the address above`,
            `Network: ${paymentDetails.network}`,
            `Reference: ${paymentReference}`,
            'Payment will be automatically detected by NOWPayments',
            'No need to submit transaction hash manually',
            'Payment confirmation usually takes 5-30 minutes'
          ],
          fees: {
            networkFeeUsd: 0, // NOWPayments handles fees
            estimatedTotal: paymentDetails.priceAmount
          }
        },
        nowpaymentsId: paymentDetails.paymentId,
        message: `NOWPayments crypto payment created for ${paymentDetails.payCurrency}`,
        correlationId
      })

    } catch (nowpaymentsError: any) {
      console.error(`[${correlationId}] NOWPayments service error:`, nowpaymentsError)
      return NextResponse.json({
        error: "Failed to generate crypto payment details",
        details: nowpaymentsError.message,
        correlationId
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error(`[${correlationId}] NOWPayments generation error:`, error)
    return NextResponse.json({
      error: "Internal server error",
      details: error.message,
      correlationId
    }, { status: 500 })
  }
}

// GET endpoint to retrieve supported cryptocurrencies from NOWPayments
export async function GET() {
  try {
    const currencies = await nowPaymentsService.getPaymentCurrencies()

    // Ensure we have a valid array
    if (!Array.isArray(currencies)) {
      throw new Error('Invalid currencies response from NOWPayments')
    }

    // Filter and format popular cryptocurrencies - be more inclusive
    const supportedCurrencies = currencies
      .filter(currency => {
        if (!currency || !currency.currency) return false
        const symbol = currency.currency.toLowerCase()
        return currency.is_popular ||
               ['btc', 'eth', 'usdt', 'usdc', 'ltc', 'doge', 'bnb', 'ada', 'dot', 'sol'].includes(symbol) ||
               symbol.includes('usdt') || symbol.includes('usdc')
      })
      .map(currency => ({
        id: currency.currency.toLowerCase(),
        name: currency.name || currency.currency.toUpperCase(),
        symbol: currency.currency.toUpperCase(),
        network: currency.network || 'Unknown',
        minAmount: currency.min_amount || 0.001,
        maxAmount: currency.max_amount || 1000000,
        isStablecoin: currency.is_stable,
        isPopular: currency.is_popular,
        smartContract: currency.smart_contract
      }))
      .sort((a, b) => {
        // Sort by popularity, then stablecoins, then alphabetically
        if (a.isPopular && !b.isPopular) return -1
        if (!a.isPopular && b.isPopular) return 1
        if (a.isStablecoin && !b.isStablecoin) return -1
        if (!a.isStablecoin && b.isStablecoin) return 1
        return a.name.localeCompare(b.name)
      })

    return NextResponse.json({
      success: true,
      currencies: supportedCurrencies,
      count: supportedCurrencies.length,
      totalAvailable: currencies.length
    })
  } catch (error: any) {
    console.error("Error fetching NOWPayments currencies:", error)

    // Return fallback currencies when service is unavailable
    const fallbackCurrencies = [
      {
        id: 'btc',
        name: 'Bitcoin',
        symbol: 'BTC',
        network: 'Bitcoin',
        minAmount: 0.0001,
        maxAmount: 100,
        isStablecoin: false,
        isPopular: true,
        smartContract: undefined
      },
      {
        id: 'eth',
        name: 'Ethereum',
        symbol: 'ETH',
        network: 'Ethereum',
        minAmount: 0.001,
        maxAmount: 1000,
        isStablecoin: false,
        isPopular: true,
        smartContract: undefined
      },
      {
        id: 'usdt',
        name: 'Tether USD',
        symbol: 'USDT',
        network: 'ERC20',
        minAmount: 1,
        maxAmount: 50000,
        isStablecoin: true,
        isPopular: true,
        smartContract: undefined
      },
      {
        id: 'usdc',
        name: 'USD Coin',
        symbol: 'USDC',
        network: 'ERC20',
        minAmount: 1,
        maxAmount: 50000,
        isStablecoin: true,
        isPopular: true,
        smartContract: undefined
      }
    ]

    return NextResponse.json({
      success: true,
      currencies: fallbackCurrencies,
      count: fallbackCurrencies.length,
      totalAvailable: fallbackCurrencies.length,
      fallback: true,
      error: "NOWPayments service temporarily unavailable - showing fallback currencies"
    })
  }
}