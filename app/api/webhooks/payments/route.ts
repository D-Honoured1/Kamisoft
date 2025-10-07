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

    // Handle Paystack webhooks
    const paystackSignature = request.headers.get("x-paystack-signature")

    let paymentData = null

    if (paystackSignature) {
      paymentData = await handlePaystackWebhook(body, paystackSignature, jsonBody)
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


async function handlePaystackWebhook(body: string, signature: string, jsonBody: any) {
  try {
    const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET

    if (!webhookSecret) {
      return null
    }

    // Verify the webhook signature
    const hash = crypto.createHmac('sha512', webhookSecret).update(body).digest('hex')
    if (hash !== signature) {
      return null
    }


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
        return null
    }
  } catch (error) {
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
    } else {
    }
  } catch (error) {
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

  } catch (error) {
  }
}

async function generateInvoicePDF(invoiceId: string, payment: any, invoiceNumber: string) {
  try {
    // TODO: Implement PDF generation using puppeteer or similar

    // Mock implementation - would typically generate actual PDF
    // You could use libraries like:
    // - puppeteer for HTML to PDF conversion
    // - jsPDF for client-side PDF generation  
    // - react-pdf for server-side PDF generation
    
    return `https://invoices.kamisoft.com/${invoiceNumber}.pdf`
  } catch (error) {
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
    
    
    // Example implementation with a hypothetical email service:
    // await emailService.send(emailData)
    
  } catch (error) {
  }
}