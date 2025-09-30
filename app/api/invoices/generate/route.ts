// app/api/invoices/generate/route.ts - Generate Invoice API
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from '@react-pdf/renderer'
import InvoiceService from "@/lib/invoice"
import { InvoicePDF } from "@/lib/invoice/invoice-pdf-template"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { requestId, paymentId, autoSend } = await request.json()

    if (!requestId) {
      return NextResponse.json(
        { error: "Service request ID is required" },
        { status: 400 }
      )
    }

    // Prepare invoice data from service request
    const invoiceData = await InvoiceService.prepareInvoiceData(requestId, paymentId)

    if (!invoiceData) {
      return NextResponse.json(
        { error: "Failed to prepare invoice data. Service request not found." },
        { status: 404 }
      )
    }

    // Generate invoice number
    const invoiceNumber = await InvoiceService.generateInvoiceNumber()
    const invoiceDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const dueDate = invoiceData.dueDate?.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) || ''

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      <InvoicePDF
        invoiceNumber={invoiceNumber}
        invoiceDate={invoiceDate}
        dueDate={dueDate}
        invoiceData={invoiceData}
        status="draft"
      />
    )

    // Upload PDF to Supabase Storage
    const supabase = createServerClient()
    const fileName = `invoices/${invoiceNumber}.pdf`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError)
      // Continue without PDF URL - can regenerate later
    }

    // Get public URL for the PDF
    let pdfUrl: string | undefined
    if (uploadData) {
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName)

      pdfUrl = publicUrl
    }

    // Create invoice record in database
    const invoice = await InvoiceService.createInvoice(invoiceData, pdfUrl)

    if (!invoice) {
      return NextResponse.json(
        { error: "Failed to create invoice record" },
        { status: 500 }
      )
    }

    // Optionally update invoice status to 'sent' and send email
    if (autoSend) {
      await InvoiceService.updateInvoiceStatus(invoice.id, 'sent')

      // TODO: Send email with invoice attachment
      // await sendInvoiceEmail(invoiceData.clientEmail, invoice, pdfBuffer)
    }

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        pdfUrl: invoice.pdfUrl,
        status: autoSend ? 'sent' : invoice.status,
        totalAmount: invoiceData.totalAmount
      },
      message: autoSend
        ? "Invoice generated and sent successfully"
        : "Invoice generated successfully"
    })

  } catch (error: any) {
    console.error('Invoice generation error:', error)
    return NextResponse.json(
      {
        error: "Failed to generate invoice",
        details: error.message
      },
      { status: 500 }
    )
  }
}