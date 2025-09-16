import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
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
        await sendBankTransferInstructions(serviceRequest.client.email, payment.id)
        break
      case "crypto":
        // TODO: Implement crypto payment
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
  // TODO: Implement Stripe checkout
  // This would typically use the Stripe SDK to create a checkout session
  console.log("Creating Stripe checkout for payment:", paymentId)

  // Mock implementation - replace with actual Stripe integration
  return `https://checkout.stripe.com/pay/mock-session-${paymentId}`
}

async function createPaystackCheckout(paymentId: string, amount: number, serviceRequest: any) {
  // TODO: Implement Paystack checkout
  // This would typically use the Paystack API to initialize a transaction
  console.log("Creating Paystack checkout for payment:", paymentId)

  // Mock implementation - replace with actual Paystack integration
  return `https://checkout.paystack.com/mock-session-${paymentId}`
}

async function sendBankTransferInstructions(email: string, paymentId: string) {
  // TODO: Implement email sending with bank transfer instructions
  console.log("Sending bank transfer instructions to:", email, "for payment:", paymentId)

  // This would typically use an email service like SendGrid, Resend, or similar
  // to send detailed bank transfer instructions to the client
}
