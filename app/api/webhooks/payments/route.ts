import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Determine webhook source based on headers or payload structure
    const stripeSignature = request.headers.get("stripe-signature")
    const paystackSignature = request.headers.get("x-paystack-signature")

    let paymentData = null

    if (stripeSignature) {
      paymentData = await handleStripeWebhook(body, stripeSignature)
    } else if (paystackSignature) {
      paymentData = await handlePaystackWebhook(body, paystackSignature)
    } else {
      return NextResponse.json({ error: "Unknown webhook source" }, { status: 400 })
    }

    if (!paymentData) {
      return NextResponse.json({ error: "Failed to process webhook" }, { status: 400 })
    }

    // Update payment status in database
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        payment_status: paymentData.status,
        [paymentData.referenceField]: paymentData.reference,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentData.paymentId)

    if (updateError) {
      console.error("Error updating payment:", updateError)
      return NextResponse.json({ error: "Failed to update payment" }, { status: 500 })
    }

    // If payment is successful, generate invoice
    if (paymentData.status === "completed") {
      await generateInvoice(paymentData.paymentId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function handleStripeWebhook(body: any, signature: string) {
  // TODO: Implement Stripe webhook verification and processing
  console.log("Processing Stripe webhook:", body.type)

  // Mock implementation - replace with actual Stripe webhook handling
  if (body.type === "checkout.session.completed") {
    return {
      paymentId: body.data.object.metadata?.paymentId,
      status: "completed",
      reference: body.data.object.id,
      referenceField: "stripe_payment_intent_id",
    }
  }

  return null
}

async function handlePaystackWebhook(body: any, signature: string) {
  // TODO: Implement Paystack webhook verification and processing
  console.log("Processing Paystack webhook:", body.event)

  // Mock implementation - replace with actual Paystack webhook handling
  if (body.event === "charge.success") {
    return {
      paymentId: body.data.metadata?.paymentId,
      status: "completed",
      reference: body.data.reference,
      referenceField: "paystack_reference",
    }
  }

  return null
}

async function generateInvoice(paymentId: string) {
  try {
    const supabase = await createClient()

    // Get payment and service request details
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select(`
        *,
        service_request:service_requests(
          *,
          client:clients(*)
        )
      `)
      .eq("id", paymentId)
      .single()

    if (paymentError || !payment) {
      console.error("Error fetching payment for invoice:", paymentError)
      return
    }

    // Create invoice record
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        request_id: payment.request_id,
        payment_id: payment.id,
        subtotal: payment.amount,
        tax_amount: 0,
        total_amount: payment.amount,
        status: "paid",
        due_date: new Date().toISOString().split("T")[0], // Today
      })
      .select("id, invoice_number")
      .single()

    if (invoiceError) {
      console.error("Error creating invoice:", invoiceError)
      return
    }

    // TODO: Generate PDF invoice and store URL
    const pdfUrl = await generateInvoicePDF(invoice.id)

    if (pdfUrl) {
      await supabase.from("invoices").update({ pdf_url: pdfUrl }).eq("id", invoice.id)
    }

    // TODO: Send invoice email to client
    await sendInvoiceEmail(payment.service_request.client.email, invoice.invoice_number, pdfUrl)

    console.log("Invoice generated successfully:", invoice.invoice_number)
  } catch (error) {
    console.error("Error generating invoice:", error)
  }
}

async function generateInvoicePDF(invoiceId: string) {
  // TODO: Implement PDF generation using puppeteer or similar
  console.log("Generating PDF for invoice:", invoiceId)

  // Mock implementation - would typically generate actual PDF
  return `https://invoices.kamisoft.com/${invoiceId}.pdf`
}

async function sendInvoiceEmail(email: string, invoiceNumber: string, pdfUrl?: string) {
  // TODO: Implement email sending with invoice attachment
  console.log("Sending invoice email to:", email, "Invoice:", invoiceNumber)

  // This would typically use an email service to send the invoice
}
