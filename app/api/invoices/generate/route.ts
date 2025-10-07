// app/api/invoices/generate/route.ts - Generate Invoice API
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import InvoiceService from "@/lib/invoice"
import { InvoicePDF } from "@/lib/invoice/invoice-pdf-template"
import { createClient } from "@supabase/supabase-js"
import { emailService } from "@/lib/email"

// Create admin client with service role for database operations
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
    let pdfBuffer: Buffer
    try {
      pdfBuffer = await renderToBuffer(
        React.createElement(InvoicePDF, {
          invoiceNumber,
          invoiceDate,
          dueDate,
          invoiceData,
          status: "draft"
        })
      )
    } catch (pdfError: any) {
      throw new Error(`PDF generation failed: ${pdfError.message}`)
    }

    // Upload PDF to Supabase Storage
    const fileName = `invoices/${invoiceNumber}.pdf`

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) {
    }

    // Get public URL for the PDF
    let pdfUrl: string | undefined
    if (uploadData) {
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('documents')
        .getPublicUrl(fileName)

      pdfUrl = publicUrl
    }

    // Create invoice record in database
    const invoiceRecord = {
      request_id: invoiceData.requestId,
      payment_id: invoiceData.paymentId,
      invoice_number: invoiceNumber,
      subtotal: invoiceData.subtotal,
      tax_amount: invoiceData.taxAmount,
      total_amount: invoiceData.totalAmount,
      status: 'draft' as const,
      due_date: invoiceData.dueDate?.toISOString().split('T')[0],
      pdf_url: pdfUrl
    }

    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .insert(invoiceRecord)
      .select('id, invoice_number, pdf_url, status')
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: "Failed to create invoice record", details: invoiceError?.message },
        { status: 500 }
      )
    }

    // Update invoice status and send email if auto-send is enabled
    if (autoSend) {
      await supabaseAdmin
        .from('invoices')
        .update({ status: 'sent' })
        .eq('id', invoice.id)

      // Send invoice email with PDF attachment
      try {
        const emailResult = await emailService.sendInvoiceEmail({
          clientName: invoiceData.clientName,
          clientEmail: invoiceData.clientEmail,
          invoiceNumber: invoiceNumber,
          invoiceDate: invoiceDate,
          totalAmount: invoiceData.totalAmount,
          pdfBuffer: pdfBuffer,
          serviceTitle: invoiceData.serviceTitle
        })

        if (!emailResult.success) {
        }
      } catch (emailError: any) {
        // Don't fail the entire request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        pdfUrl: invoice.pdfUrl,
        status: autoSend ? 'sent' : invoice.status,
        totalAmount: invoiceData.totalAmount,
        invoice_number: invoice.invoiceNumber,
        total_amount: invoiceData.totalAmount,
        pdf_url: invoice.pdfUrl
      },
      message: autoSend
        ? "Invoice generated and sent successfully"
        : "Invoice generated successfully"
    })

  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to generate invoice",
        details: error.message
      },
      { status: 500 }
    )
  }
}
