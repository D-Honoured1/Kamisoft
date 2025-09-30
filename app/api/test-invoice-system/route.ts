// Test endpoint to debug invoice generation components
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import InvoiceService from "@/lib/invoice"
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { InvoicePDF } from "@/lib/invoice/invoice-pdf-template"

export async function GET(request: Request) {
  const tests: any = {
    timestamp: new Date().toISOString(),
    tests: {}
  }

  try {
    // Test 1: Supabase Connection
    console.log('[TEST] Testing Supabase connection...')
    try {
      const supabase = createServerClient()
      const { data, error } = await supabase.from('service_requests').select('id').limit(1)
      tests.tests.supabaseConnection = error ? { success: false, error: error.message } : { success: true, count: data?.length || 0 }
    } catch (e: any) {
      tests.tests.supabaseConnection = { success: false, error: e.message }
    }

    // Test 2: Storage Bucket Exists
    console.log('[TEST] Testing storage bucket...')
    try {
      const supabase = createServerClient()
      const { data, error } = await supabase.storage.getBucket('documents')
      tests.tests.storageBucket = error ? { success: false, error: error.message, hint: 'Create the "documents" bucket in Supabase Storage (public)' } : { success: true, bucket: data }
    } catch (e: any) {
      tests.tests.storageBucket = { success: false, error: e.message }
    }

    // Test 3: Invoice Number Generation
    console.log('[TEST] Testing invoice number generation...')
    try {
      const invoiceNumber = await InvoiceService.generateInvoiceNumber()
      tests.tests.invoiceNumberGeneration = { success: true, invoiceNumber }
    } catch (e: any) {
      tests.tests.invoiceNumberGeneration = { success: false, error: e.message, stack: e.stack }
    }

    // Test 4: PDF Generation
    console.log('[TEST] Testing PDF generation...')
    try {
      const testInvoiceData = {
        requestId: 'test-123',
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        serviceTitle: 'Test Service',
        serviceDescription: 'Test Description',
        serviceCategory: 'test_category',
        items: [{
          description: 'Test Item',
          quantity: 1,
          unitPrice: 100,
          amount: 100
        }],
        subtotal: 100,
        taxRate: 0.075,
        taxAmount: 7.5,
        totalAmount: 107.5,
        dueDate: new Date(),
        notes: 'Test notes'
      }

      const pdfBuffer = await renderToBuffer(
        React.createElement(InvoicePDF, {
          invoiceNumber: 'TEST-2025-0001',
          invoiceDate: new Date().toLocaleDateString(),
          dueDate: new Date().toLocaleDateString(),
          invoiceData: testInvoiceData,
          status: 'draft'
        })
      )

      tests.tests.pdfGeneration = {
        success: true,
        pdfSize: pdfBuffer.length,
        message: `PDF generated successfully (${pdfBuffer.length} bytes)`
      }
    } catch (e: any) {
      tests.tests.pdfGeneration = {
        success: false,
        error: e.message,
        stack: e.stack?.substring(0, 500)
      }
    }

    // Test 5: Email Service Configuration
    console.log('[TEST] Testing email service config...')
    try {
      const hasEmailConfig = !!(
        process.env.SMTP_HOST &&
        process.env.SMTP_PORT &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
      )

      tests.tests.emailConfig = {
        success: hasEmailConfig,
        configured: hasEmailConfig,
        host: process.env.SMTP_HOST ? '✓ Set' : '✗ Missing',
        port: process.env.SMTP_PORT ? '✓ Set' : '✗ Missing',
        user: process.env.SMTP_USER ? '✓ Set' : '✗ Missing',
        pass: process.env.SMTP_PASS ? '✓ Set' : '✗ Missing',
        message: hasEmailConfig ? 'Email SMTP configured' : 'Email SMTP NOT configured - invoices will generate but not send'
      }
    } catch (e: any) {
      tests.tests.emailConfig = { success: false, error: e.message }
    }

    // Summary
    const allPassed = Object.values(tests.tests).every((t: any) => t.success)
    tests.summary = {
      allTestsPassed: allPassed,
      message: allPassed ? '✅ All systems operational!' : '⚠️ Some components need attention',
      recommendation: !tests.tests.storageBucket?.success
        ? 'Create "documents" storage bucket in Supabase (public access)'
        : !tests.tests.pdfGeneration?.success
        ? 'PDF generation failed - check @react-pdf/renderer compatibility'
        : !tests.tests.emailConfig?.success
        ? 'Configure SMTP settings to enable email sending'
        : 'System ready for invoice generation'
    }

  } catch (error: any) {
    tests.error = error.message
    tests.stack = error.stack
  }

  return NextResponse.json(tests, { status: 200 })
}