// app/api/webhooks/paystack/route.ts - Nigeria-focused Paystack webhook handler
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { paystackService } from '@/lib/paystack'

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

export async function POST(req: NextRequest) {
  let eventData: any = null
  let webhookEventId: string | null = null

  try {
    const body = await req.text()
    const signature = req.headers.get('x-paystack-signature')


    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    // Verify webhook signature using utility function
    if (!paystackService.validateWebhookSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Parse webhook event
    try {
      eventData = JSON.parse(body)
      webhookEventId = eventData.id || `${eventData.event}_${Date.now()}`
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }


    // Handle different event types with improved error handling
    let result: any = null
    switch (eventData.event) {
      case 'charge.success':
        result = await handleChargeSuccess(eventData.data, webhookEventId)
        break
      case 'charge.failed':
        result = await handleChargeFailed(eventData.data, webhookEventId)
        break
      case 'transfer.success':
        result = await handleTransferSuccess(eventData.data, webhookEventId)
        break
      case 'transfer.failed':
        result = await handleTransferFailed(eventData.data, webhookEventId)
        break
      case 'invoice.create':
      case 'invoice.update':
      case 'invoice.payment_failed':
        result = { processed: false, reason: 'Invoice events not implemented yet' }
        break
      default:
        result = { processed: false, reason: 'Event type not handled' }
    }

    // Log webhook processing result

    return NextResponse.json({
      status: 'success',
      event: eventData.event,
      reference: eventData.data?.reference,
      processed: result?.success !== false
    })

  } catch (error: any) {

    // Return 200 to acknowledge receipt but log the error
    return NextResponse.json({
      status: 'error',
      message: 'Webhook processing failed',
      event: eventData?.event || 'unknown',
      error: error.message
    }, { status: 500 })
  }
}

async function handleChargeSuccess(data: any, webhookEventId: string) {
  try {
    const paymentId = data.metadata?.paymentId
    const ngnEquivalent = data.metadata?.ngnEquivalent
    const exchangeRate = data.metadata?.exchangeRate || 1550


    if (!paymentId) {
      return { success: false, error: 'Missing payment ID in metadata' }
    }

    // Check if payment already processed to prevent duplicate processing
    const { data: existingPayment } = await supabaseAdmin
      .from('payments')
      .select('payment_status, paystack_reference')
      .eq('id', paymentId)
      .single()

    if (existingPayment?.payment_status === 'confirmed') {
      return { success: true, message: 'Payment already confirmed' }
    }

    // Update payment status with comprehensive metadata
    const { error } = await supabaseAdmin
      .from('payments')
      .update({
        payment_status: 'confirmed',
        paystack_reference: data.reference,
        confirmed_at: new Date().toISOString(),
        confirmed_by: 'paystack_webhook',
        admin_notes: `Payment confirmed via Paystack webhook: ${data.reference}. Currency: ${data.currency}. Amount: ${data.currency === 'NGN' ? '₦' : '$'}${(data.amount / 100).toLocaleString()}. Channel: ${data.channel}`,
        metadata: JSON.stringify({
          paystack_data: {
            reference: data.reference,
            amount_paid: data.amount / 100,
            currency: data.currency,
            channel: data.channel,
            gateway_response: data.gateway_response,
            paid_at: data.paid_at,
            transaction_date: data.transaction_date,
            authorization: data.authorization,
            customer: data.customer,
            fees: data.fees,
            fees_breakdown: data.fees_breakdown
          },
          ngn_equivalent: ngnEquivalent,
          exchange_rate: exchangeRate,
          webhook_event_id: webhookEventId,
          processed_at: new Date().toISOString()
        }),
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)

    if (error) {
      return { success: false, error: error.message }
    }


    // Update service request status and send notifications
    if (data.metadata?.requestId) {
      try {
        await updateServiceRequestStatus(data.metadata.requestId, data.metadata?.paymentType)

        // Auto-generate invoice for this payment
        await generateInvoiceForPayment(paymentId, data.metadata.requestId)

        // Send confirmation email with invoice
        await sendPaymentConfirmationEmail(data)
      } catch (notificationError: any) {
      }
    }

    return { success: true, paymentId, reference: data.reference }

  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

async function handleChargeFailed(data: any, webhookEventId: string) {
  try {
    const paymentId = data.metadata?.paymentId


    if (paymentId) {
      const { error } = await supabaseAdmin
        .from('payments')
        .update({
          payment_status: 'failed',
          paystack_reference: data.reference,
          error_message: data.gateway_response || 'Payment failed',
          admin_notes: `Payment failed via Paystack webhook: ${data.gateway_response || 'Unknown error'}. Reference: ${data.reference}`,
          metadata: JSON.stringify({
            paystack_failure_data: {
              reference: data.reference,
              gateway_response: data.gateway_response,
              channel: data.channel,
              currency: data.currency,
              amount: data.amount / 100,
              failed_at: data.created_at || new Date().toISOString()
            },
            webhook_event_id: webhookEventId,
            processed_at: new Date().toISOString()
          }),
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, paymentId, status: 'failed' }
    } else {
      return { success: false, error: 'No payment ID in metadata' }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

async function handleTransferSuccess(data: any, webhookEventId: string) {
  try {
    // Handle successful transfers (if you implement automatic payouts)
    return { success: true, type: 'transfer_success' }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

async function handleTransferFailed(data: any, webhookEventId: string) {
  try {
    // Handle failed transfers
    return { success: true, type: 'transfer_failed' }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

async function updateServiceRequestStatus(requestId: string, paymentType?: string) {
  try {
    // Determine new status based on payment type
    const newStatus = paymentType === 'full' ? 'paid_in_full' : 'in_progress'
    
    const { error } = await supabaseAdmin
      .from('service_requests')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (error) {
    } else {
    }
  } catch (error) {
  }
}

async function generateInvoiceForPayment(paymentId: string, requestId: string) {
  try {
    // Check if invoice already exists for this payment
    const { data: existingInvoice } = await supabaseAdmin
      .from('invoices')
      .select('id')
      .eq('payment_id', paymentId)
      .single()

    if (existingInvoice) {
      return existingInvoice
    }

    // Generate invoice via internal API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/invoices/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId,
        paymentId,
        autoSend: false // Don't send email yet, we'll attach it ourselves
      })
    })

    if (!response.ok) {
      return null
    }

    const result = await response.json()

    // Mark invoice as sent since we're sending it via email
    if (result.invoice?.id) {
      await supabaseAdmin
        .from('invoices')
        .update({ status: 'sent' })
        .eq('id', result.invoice.id)
    }

    return result.invoice
  } catch (error) {
    return null
  }
}

async function sendPaymentConfirmationEmail(paystackData: any) {
  try {
    // Get payment and service request details
    const paymentId = paystackData.metadata?.paymentId
    if (!paymentId) return

    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select(`
        *,
        service_requests (
          *,
          clients (*)
        )
      `)
      .eq('id', paymentId)
      .single()

    if (!payment) return

    // Get invoice for this payment (if generated)
    const { data: invoice } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('payment_id', paymentId)
      .single()

    // Prepare email content
    const clientName = payment.service_requests.clients.name
    const serviceTitle = payment.service_requests.title
    const amountPaid = `${paystackData.currency === 'NGN' ? '₦' : '$'}${(paystackData.amount / 100).toLocaleString()}`
    const paymentType = paystackData.metadata?.paymentType === 'split' ? '50% Upfront Payment' : 'Full Payment'

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Confirmed! ✓</h1>
      <p>Kamisoft Enterprises</p>
    </div>
    <div class="content">
      <p>Dear ${clientName},</p>
      <p>Thank you! Your payment has been successfully received and confirmed.</p>

      <div class="info-box">
        <h3>Payment Details:</h3>
        <p><strong>Service:</strong> ${serviceTitle}</p>
        <p><strong>Amount Paid:</strong> ${amountPaid}</p>
        <p><strong>Payment Type:</strong> ${paymentType}</p>
        <p><strong>Reference:</strong> ${paystackData.reference}</p>
        <p><strong>Payment Method:</strong> ${paystackData.channel}</p>
        <p><strong>Transaction Date:</strong> ${new Date(paystackData.paid_at).toLocaleString('en-NG')}</p>
      </div>

      ${invoice ? `
      <div class="info-box">
        <h3>Invoice Details:</h3>
        <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
        <p><strong>Total Amount:</strong> $${invoice.total_amount.toLocaleString()}</p>
        <p>Your invoice is attached to this email for your records.</p>
      </div>
      ` : ''}

      <p><strong>What's Next?</strong></p>
      <p>${paystackData.metadata?.paymentType === 'full'
        ? 'Your project is now fully paid! Our team will begin work immediately and keep you updated on progress.'
        : 'Thank you for the upfront payment! Our team will begin work shortly. The remaining balance will be due upon completion.'
      }</p>

      <p>If you have any questions, please don't hesitate to contact us.</p>

      <p>Best regards,<br>Kamisoft Enterprises Team</p>
    </div>
    <div class="footer">
      <p>Kamisoft Enterprises | Lagos, Nigeria</p>
      <p>Email: support@kamisoftenterprises.online | Phone: +234 803 639 2157</p>
      <p>Website: www.kamisoftenterprises.online</p>
    </div>
  </div>
</body>
</html>
    `

    // Send email using nodemailer (via email service)
    const { emailService } = await import('@/lib/email')

    const emailOptions: any = {
      to: payment.service_requests.clients.email,
      subject: `Payment Confirmed - ${serviceTitle} | Kamisoft Enterprises`,
      html: htmlContent,
      text: `Payment Confirmed!\n\nDear ${clientName},\n\nYour payment of ${amountPaid} for ${serviceTitle} has been confirmed.\n\nReference: ${paystackData.reference}\n${invoice ? `Invoice: ${invoice.invoice_number}\n` : ''}\n\nThank you for your business!\n\nKamisoft Enterprises\nsupport@kamisoftenterprises.online`
    }

    // Attach invoice PDF if available
    if (invoice?.pdf_url) {
      try {
        const pdfResponse = await fetch(invoice.pdf_url)
        const pdfBuffer = await pdfResponse.arrayBuffer()

        emailOptions.attachments = [{
          filename: `${invoice.invoice_number}.pdf`,
          content: Buffer.from(pdfBuffer)
        }]
      } catch (pdfError) {
        // Continue sending email without PDF
      }
    }

    await emailService.sendEmail(emailOptions)

  } catch (error) {
  }
}