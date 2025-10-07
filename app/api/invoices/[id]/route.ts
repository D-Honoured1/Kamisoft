// app/api/invoices/[id]/route.ts - Get and manage individual invoices
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import InvoiceService from "@/lib/invoice"

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/invoices/[id] - Get invoice details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const invoice = await InvoiceService.getInvoice(params.id)

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      invoice
    })

  } catch (error: any) {
    console.error('Get invoice error:', error)
    return NextResponse.json(
      { error: "Failed to fetch invoice", details: error.message },
      { status: 500 }
    )
  }
}

// PATCH /api/invoices/[id] - Update invoice status
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { status } = await request.json()

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      )
    }

    const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const success = await InvoiceService.updateInvoiceStatus(params.id, status)

    if (!success) {
      return NextResponse.json(
        { error: "Failed to update invoice status" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Invoice status updated to: ${status}`
    })

  } catch (error: any) {
    console.error('Update invoice error:', error)
    return NextResponse.json(
      { error: "Failed to update invoice", details: error.message },
      { status: 500 }
    )
  }
}