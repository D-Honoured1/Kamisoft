// app/api/admin/clients/route.ts - UPDATED VERSION WITH CONTACT INQUIRIES
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

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

export async function GET() {
  try {
    const { data: clients, error } = await supabaseAdmin
      .from("clients")
      .select(`
        id,
        name,
        email,
        phone,
        company,
        created_at,
        updated_at,
        archived_at,
        archived_by,
        archive_reason,
        service_requests (
          id,
          request_source,
          status,
          service_category,
          created_at
        ),
        contact_inquiries (
          id,
          status,
          subject,
          created_at
        )
      `)
      .is("archived_at", null) // Only fetch non-archived clients by default
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch clients", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      clients: clients || [],
      total: clients?.length || 0,
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { clientId, reason = "Archived by admin" } = body

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      )
    }

    // Get the current admin user ID from the request headers or JWT
    // For now, we'll use a placeholder - in production, extract from auth token
    const adminId = "placeholder-admin-id" // TODO: Extract from authenticated session

    // Use the archive_client function
    const { data, error } = await supabaseAdmin.rpc('archive_client', {
      client_id: clientId,
      admin_id: adminId,
      reason: reason
    })

    if (error) {

      // Handle specific error cases
      if (error.message.includes("not found") || error.message.includes("already archived")) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: "Failed to archive client", details: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: "Client not found or already archived" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Client archived successfully"
    })

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}