// app/api/invoices/generate/route.ts - Generate Invoice API
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import InvoiceService from "@/lib/invoice"
import { InvoicePDF } from "@/lib/invoice/invoice-pdf-template"
import { createServerClient } from "@/lib/supabase/server"
import { emailService } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    console.log('[INVOICE] Starting invoice generation...')
    const { requestId, paymentId, autoSend } = await request.json()
    console.log('[INVOICE] Request params:', { requestId, paymentId, autoSend })

    if (!requestId) {
      console.error('[INVOICE] Missing requestId')
      return NextResponse.json(
        { error: "Service request ID is required" },
        { status: 400 }
      )
    }

    // Prepare invoice data from service request
    console.log('[INVOICE] Preparing invoice data...')
    const invoiceData = await InvoiceService.prepareInvoiceData(requestId, paymentId)

    if (!invoiceData) {
      console.error('[INVOICE] Failed to prepare invoice data - service request not found')
      return NextResponse.json(
        { error: "Failed to prepare invoice data. Service request not found." },
        { status: 404 }
      )
    }

    console.log('[INVOICE] Invoice data prepared successfully:', {
      clientName: invoiceData.clientName,
      clientEmail: invoiceData.clientEmail,
      totalAmount: invoiceData.totalAmount
    })

    // Generate invoice number
    console.log('[INVOICE] Generating invoice number...')
    const invoiceNumber = await InvoiceService.generateInvoiceNumber()
    console.log('[INVOICE] Invoice number generated:', invoiceNumber)

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

    // Generate PDF using React.createElement to avoid JSX syntax issues
    console.log('[INVOICE] Rendering PDF...')
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
      console.log('[INVOICE] PDF rendered successfully, size:', pdfBuffer.length, 'bytes')
    } catch (pdfError: any) {
      console.error('[INVOICE] PDF rendering failed:', pdfError)
      throw new Error(`PDF generation failed: ${pdfError.message}`)
    }

    // Upload PDF to Supabase Storage
    console.log('[INVOICE] Uploading PDF to storage...')
    const supabase = createServerClient()
    const fileName = `invoices/${invoiceNumber}.pdf`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) {
      console.error('[INVOICE] Storage upload failed:', uploadError)
      console.error('[INVOICE] Upload error details:', JSON.stringify(uploadError))
      // Continue without PDF URL - can regenerate later
    } else {
      console.log('[INVOICE] PDF uploaded successfully:', fileName)
    }

    // Get public URL for the PDF
    let pdfUrl: string | undefined
    if (uploadData) {
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName)

      pdfUrl = publicUrl
      console.log('[INVOICE] PDF public URL:', pdfUrl)
    }

    // Create invoice record in database
    console.log('[INVOICE] Creating invoice record in database...')
    const invoice = await InvoiceService.createInvoice(invoiceData, pdfUrl)

    if (!invoice) {
      console.error('[INVOICE] Failed to create invoice record in database')
      return NextResponse.json(
        { error: "Failed to create invoice record" },
        { status: 500 }
      )
    }

    console.log('[INVOICE] Invoice record created:', invoice.id, invoice.invoiceNumber)

    // Optionally update invoice status to 'sent' and send email
    if (autoSend) {
      console.log('[INVOICE] Auto-send enabled, updating status to sent...')
      await InvoiceService.updateInvoiceStatus(invoice.id, 'sent')
      console.log('[INVOICE] Invoice status updated to sent')

      // Send invoice email with PDF attachment
      console.log('[INVOICE] Sending invoice email to:', invoiceData.clientEmail)
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

        if (emailResult.success) {
          console.log('[INVOICE] Email sent successfully to:', invoiceData.clientEmail)
          console.log('[INVOICE] Email message ID:', emailResult.messageId)
        } else {
          console.error('[INVOICE] Email sending failed:', emailResult.error)
        }
      } catch (emailError: any) {
        console.error('[INVOICE] Failed to send invoice email:', emailError)
        console.error('[INVOICE] Email error stack:', emailError.stack)
        // Don't fail the entire request if email fails
      }
    } else {
      console.log('[INVOICE] Auto-send disabled, invoice created in draft status')
    }

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        pdfUrl: invoice.pdfUrl,
        status: autoSend ? 'sent' : invoice.status,
        totalAmount: invoiceData.totalAmount,
        invoice_number: invoice.invoiceNumber, // Also provide snake_case for compatibility
        total_amount: invoiceData.totalAmount,
        pdf_url: invoice.pdfUrl
      },
      message: autoSend
        ? "Invoice generated and sent successfully"
        : "Invoice generated successfully"
    })

    console.log('[INVOICE] Invoice generation completed successfully!')

  } catch (error: any) {
    console.error('[INVOICE] ❌ Invoice generation error:', error)
    console.error('[INVOICE] Error message:', error.message)
    console.error('[INVOICE] Error stack:', error.stack)
    return NextResponse.json(
      {
        error: "Failed to generate invoice",
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}