// app/api/webhooks/payments/route.ts
export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await request.text() // Get raw body for signature verification
    const jsonBody = JSON.parse(body)

    // Determine webhook source based on headers or payload structure
    const stripeSignature = request.headers.get("stripe-signature")
    const paystackSignature = request.headers.get("x-paystack-signature")

    let paymentData = null

    if (stripeSignature) {
      paymentData = await handleStripeWebhook(body, stripeSignature, jsonBody)
    } else if (paystackSignature) {
      paymentData = await handlePaystackWebhook(body, paystackSignature, jsonBody)
    } else {
      console.error("Unknown webhook source - no valid signature found")
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

    // If payment is successful, generate invoice and update service request
    if (paymentData.status === "completed") {
      await Promise.all([
        generateInvoice(paymentData.paymentId),
        updateServiceRequestStatus(paymentData.paymentId, "in_progress")
      ])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function handleStripeWebhook(body: string, signature: string, jsonBody: any) {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error("Stripe webhook secret not configured")
      return null
    }

    // Verify the webhook signature
    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error(`Stripe webhook signature verification failed:`, err.message)
      return null
    }

    console.log("Processing Stripe webhook:", event.type)

    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object
        return {
          paymentId: session.metadata?.paymentId,
          status: "completed",
          reference: session.id,
          referenceField: "stripe_payment_intent_id",
          amount: session.amount_total / 100, // Convert from cents
          customerEmail: session.customer_email
        }
      
      case "checkout.session.expired":
        const expiredSession = event.data.object
        return {
          paymentId: expiredSession.metadata?.paymentId,
          status: "failed",
          reference: expiredSession.id,
          referenceField: "stripe_payment_intent_id",
        }

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object
        return {
          paymentId: failedPayment.metadata?.paymentId,
          status: "failed",
          reference: failedPayment.id,
          referenceField: "stripe_payment_intent_id",
        }

      default:
        console.log(`Unhandled Paystack event type: ${jsonBody.event}`)
        return null
    }
  } catch (error) {
    console.error("Error processing Paystack webhook:", error)
    return null
  }
}

async function updateServiceRequestStatus(paymentId: string, status: string) {
  try {
    const supabase = createServerClient()

    // Get the payment and associated service request
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("request_id")
      .eq("id", paymentId)
      .single()

    if (paymentError || !payment) {
      console.error("Error fetching payment for service request update:", paymentError)
      return
    }

    // Update the service request status
    const { error: updateError } = await supabase
      .from("service_requests")
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq("id", payment.request_id)

    if (updateError) {
      console.error("Error updating service request status:", updateError)
    } else {
      console.log(`Service request ${payment.request_id} status updated to ${status}`)
    }
  } catch (error) {
    console.error("Error updating service request status:", error)
  }
}

async function generateInvoice(paymentId: string) {
  try {
    const supabase = createServerClient()

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

    // Generate invoice number
    const invoiceNumber = `KE-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

    // Create invoice record
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        request_id: payment.request_id,
        payment_id: payment.id,
        invoice_number: invoiceNumber,
        subtotal: payment.amount,
        tax_amount: 0,
        total_amount: payment.amount,
        status: "paid",
        due_date: new Date().toISOString().split("T")[0], // Today
        issued_date: new Date().toISOString().split("T")[0],
      })
      .select("id, invoice_number")
      .single()

    if (invoiceError) {
      console.error("Error creating invoice:", invoiceError)
      return
    }

    // TODO: Generate PDF invoice and store URL
    const pdfUrl = await generateInvoicePDF(invoice.id, payment, invoice.invoice_number)

    if (pdfUrl) {
      await supabase.from("invoices").update({ pdf_url: pdfUrl }).eq("id", invoice.id)
    }

    // TODO: Send invoice email to client
    await sendInvoiceEmail(
      payment.service_request.client.email, 
      invoice.invoice_number, 
      payment.service_request.client.name,
      payment.service_request.title,
      payment.amount,
      pdfUrl
    )

    console.log("Invoice generated successfully:", invoice.invoice_number)
  } catch (error) {
    console.error("Error generating invoice:", error)
  }
}

async function generateInvoicePDF(invoiceId: string, payment: any, invoiceNumber: string) {
  try {
    // TODO: Implement PDF generation using puppeteer or similar
    console.log("Generating PDF for invoice:", invoiceId)

    // Mock implementation - would typically generate actual PDF
    // You could use libraries like:
    // - puppeteer for HTML to PDF conversion
    // - jsPDF for client-side PDF generation  
    // - react-pdf for server-side PDF generation
    
    return `https://invoices.kamisoft.com/${invoiceNumber}.pdf`
  } catch (error) {
    console.error("Error generating invoice PDF:", error)
    return null
  }
}

async function sendInvoiceEmail(
  email: string, 
  invoiceNumber: string, 
  clientName: string,
  serviceTitle: string,
  amount: number,
  pdfUrl?: string
) {
  try {
    // TODO: Implement email sending with invoice attachment
    console.log("Sending invoice email to:", email, "Invoice:", invoiceNumber)

    // This would typically use an email service like:
    // - SendGrid
    // - Resend  
    // - AWS SES
    // - Mailgun
    
    const emailData = {
      to: email,
      subject: `Invoice ${invoiceNumber} - Payment Confirmation`,
      template: 'invoice-email',
      data: {
        clientName,
        invoiceNumber,
        serviceTitle,
        amount: amount.toFixed(2),
        pdfUrl,
        companyName: 'Kamisoft Enterprises'
      }
    }
    
    console.log("Email data prepared:", emailData)
    
    // Example implementation with a hypothetical email service:
    // await emailService.send(emailData)
    
  } catch (error) {
    console.error("Error sending invoice email:", error)
  }
}console.log(`Unhandled Stripe event type: ${event.type}`)
        return null
    }
  } catch (error) {
    console.error("Error processing Stripe webhook:", error)
    return null
  }
}

async function handlePaystackWebhook(body: string, signature: string, jsonBody: any) {
  try {
    const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error("Paystack webhook secret not configured")
      return null
    }

    // Verify the webhook signature
    const hash = crypto.createHmac('sha512', webhookSecret).update(body).digest('hex')
    if (hash !== signature) {
      console.error("Paystack webhook signature verification failed")
      return null
    }

    console.log("Processing Paystack webhook:", jsonBody.event)

    switch (jsonBody.event) {
      case "charge.success":
        const successData = jsonBody.data
        return {
          paymentId: successData.metadata?.paymentId,
          status: "completed",
          reference: successData.reference,
          referenceField: "paystack_reference",
          amount: successData.amount / 100, // Convert from kobo
          customerEmail: successData.customer.email
        }

      case "charge.failed":
        const failedData = jsonBody.data
        return {
          paymentId: failedData.metadata?.paymentId,
          status: "failed",
          reference: failedData.reference,
          referenceField: "paystack_reference",
        }

      default: