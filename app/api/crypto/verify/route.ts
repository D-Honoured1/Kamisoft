// app/api/crypto/verify/route.ts - Crypto payment verification
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

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

// Tron API endpoints for TRC20 USDT verification
const TRON_ENDPOINTS = [
  'https://api.trongrid.io',
  'https://api.tronscan.org/api'
]

interface TronTransaction {
  txid: string
  to: string
  from: string
  amount: number
  timestamp: number
  confirmed: boolean
  token?: {
    symbol: string
    address: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const { paymentId, transactionHash, network = 'TRC20' } = await request.json()

    if (!paymentId || !transactionHash) {
      return NextResponse.json(
        { error: "Payment ID and transaction hash are required" },
        { status: 400 }
      )
    }

    console.log(`🔍 Verifying crypto payment: ${paymentId}, TX: ${transactionHash}`)

    // Get payment details
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select(`
        *,
        service_requests (
          title,
          clients (name, email)
        )
      `)
      .eq("id", paymentId)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      )
    }

    if (payment.payment_status === 'confirmed') {
      return NextResponse.json({
        success: true,
        message: "Payment already confirmed",
        status: "already_confirmed"
      })
    }

    // Verify the transaction based on network
    let verificationResult
    switch (network.toLowerCase()) {
      case 'trc20':
        verificationResult = await verifyTRC20Transaction(transactionHash, payment)
        break
      default:
        return NextResponse.json(
          { error: "Unsupported network" },
          { status: 400 }
        )
    }

    if (!verificationResult.valid) {
      return NextResponse.json({
        success: false,
        error: verificationResult.error,
        details: verificationResult.details
      }, { status: 400 })
    }

    // Update payment status to pending verification (requires admin approval)
    const { error: updateError } = await supabaseAdmin
      .from("payments")
      .update({
        payment_status: 'processing',
        crypto_transaction_hash: transactionHash,
        crypto_network: network,
        admin_notes: `Crypto transaction submitted: ${transactionHash}. Amount: ${verificationResult.amount} USDT. Awaiting admin verification.`,
        metadata: JSON.stringify({
          ...JSON.parse(payment.metadata || '{}'),
          crypto_verification: {
            transaction_hash: transactionHash,
            network: network,
            amount_received: verificationResult.amount,
            from_address: verificationResult.fromAddress,
            to_address: verificationResult.toAddress,
            verified_at: new Date().toISOString(),
            block_number: verificationResult.blockNumber,
            confirmations: verificationResult.confirmations
          }
        }),
        updated_at: new Date().toISOString()
      })
      .eq("id", paymentId)

    if (updateError) {
      console.error("Error updating payment:", updateError)
      return NextResponse.json(
        { error: "Failed to update payment" },
        { status: 500 }
      )
    }

    // Auto-confirm if transaction meets criteria (optional - you might want admin approval)
    const shouldAutoConfirm = verificationResult.confirmations >= 6 && 
                               Math.abs(verificationResult.amount - payment.amount) < 0.01

    if (shouldAutoConfirm) {
      await supabaseAdmin
        .from("payments")
        .update({
          payment_status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          confirmed_by: 'crypto_auto_verification',
          admin_notes: `Auto-confirmed crypto payment. TX: ${transactionHash}, Amount: ${verificationResult.amount} USDT`
        })
        .eq("id", paymentId)

      console.log(`✅ Auto-confirmed crypto payment: ${paymentId}`)
    }

    return NextResponse.json({
      success: true,
      message: shouldAutoConfirm ? "Payment confirmed automatically" : "Payment submitted for verification",
      status: shouldAutoConfirm ? "confirmed" : "pending_verification",
      transaction: {
        hash: transactionHash,
        amount: verificationResult.amount,
        confirmations: verificationResult.confirmations,
        network: network
      }
    })

  } catch (error: any) {
    console.error("Crypto verification error:", error)
    return NextResponse.json(
      { error: "Verification failed", details: error.message },
      { status: 500 }
    )
  }
}

async function verifyTRC20Transaction(txHash: string, payment: any): Promise<{
  valid: boolean
  amount?: number
  fromAddress?: string
  toAddress?: string
  blockNumber?: number
  confirmations?: number
  error?: string
  details?: string
}> {
  try {
    // Try multiple Tron API endpoints for reliability
    for (const endpoint of TRON_ENDPOINTS) {
      try {
        const response = await fetch(`${endpoint}/v1/transactions/${txHash}`, {
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) continue

        const txData = await response.json()

        // Parse USDT transfer from TRC20 transaction
        if (!txData.trc20TransferInfo || txData.trc20TransferInfo.length === 0) {
          continue
        }

        const usdtTransfer = txData.trc20TransferInfo.find((transfer: any) => 
          transfer.symbol === 'USDT' || 
          transfer.contract_address === 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
        )

        if (!usdtTransfer) {
          return {
            valid: false,
            error: "No USDT transfer found in transaction",
            details: "Transaction does not contain USDT transfer"
          }
        }

        const amountReceived = parseFloat(usdtTransfer.amount_str) / Math.pow(10, usdtTransfer.decimals)
        const toAddress = usdtTransfer.to_address
        const fromAddress = usdtTransfer.from_address

        // Verify the amount matches (allow small rounding differences)
        const expectedAmount = payment.amount
        if (Math.abs(amountReceived - expectedAmount) > 0.01) {
          return {
            valid: false,
            error: "Amount mismatch",
            details: `Expected ${expectedAmount} USDT, received ${amountReceived} USDT`
          }
        }

        // Verify the destination address matches our payment address
        const expectedAddress = payment.crypto_address
        if (expectedAddress && toAddress !== expectedAddress) {
          return {
            valid: false,
            error: "Address mismatch", 
            details: `Payment sent to ${toAddress}, expected ${expectedAddress}`
          }
        }

        // Check transaction confirmations
        const currentBlock = await getCurrentTronBlock()
        const confirmations = currentBlock ? Math.max(0, currentBlock - (txData.blockNumber || 0)) : 0

        return {
          valid: true,
          amount: amountReceived,
          fromAddress,
          toAddress,
          blockNumber: txData.blockNumber,
          confirmations
        }

      } catch (apiError) {
        console.error(`Error with ${endpoint}:`, apiError)
        continue
      }
    }

    return {
      valid: false,
      error: "Unable to verify transaction",
      details: "All Tron API endpoints failed"
    }

  } catch (error: any) {
    console.error("TRC20 verification error:", error)
    return {
      valid: false,
      error: "Verification failed",
      details: error.message
    }
  }
}

async function getCurrentTronBlock(): Promise<number | null> {
  try {
    const response = await fetch('https://api.trongrid.io/v1/blocks/latest')
    if (response.ok) {
      const data = await response.json()
      return data.block_header?.raw_data?.number || null
    }
  } catch (error) {
    console.error("Error getting current block:", error)
  }
  return null
}

// Manual verification endpoint for admins
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('payment_id')
    const txHash = searchParams.get('tx_hash')

    if (!paymentId || !txHash) {
      return NextResponse.json(
        { error: "payment_id and tx_hash parameters required" },
        { status: 400 }
      )
    }

    // Get payment details
    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single()

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      )
    }

    // Verify the transaction
    const verification = await verifyTRC20Transaction(txHash, payment)

    return NextResponse.json({
      paymentId,
      transactionHash: txHash,
      verification,
      payment: {
        amount: payment.amount,
        status: payment.payment_status,
        crypto_address: payment.crypto_address
      }
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: "Verification failed", details: error.message },
      { status: 500 }
    )
  }
}