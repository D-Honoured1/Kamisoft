// app/api/invoices/list/route.ts - List all invoices (admin)
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import InvoiceService from "@/lib/invoice"

// GET /api/invoices/list - List all invoices with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    const { invoices, total } = await InvoiceService.listInvoices({
      status,
      limit,
      offset
    })

    return NextResponse.json({
      success: true,
      invoices,
      total,
      pagination: {
        limit,
        offset,
        hasMore: total > offset + limit
      }
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to list invoices", details: error.message },
      { status: 500 }
    )
  }
}