// app/api/admin/clients/[id]/route.ts - Individual client operations
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

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { data: client, error } = await supabaseAdmin
      .from("clients")
      .select(`
        *,
        service_requests (
          id,
          title,
          service_category,
          request_source,
          status,
          created_at,
          preferred_date
        ),
        payments (
          id,
          amount,
          currency,
          payment_status,
          created_at
        )
      `)
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("Error fetching client:", error)
      return NextResponse.json(
        { error: "Client not found", details: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      client
    })
  } catch (error) {
    console.error("Get client API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json()
    const { reason = "Archived by admin" } = body || {}

    // Try to get admin ID from authenticated session, otherwise use null
    let adminId = null
    try {
      const { data: { user } } = await supabaseAdmin.auth.getUser()
      adminId = user?.id || null
    } catch (err) {
      console.log('Could not get admin user, proceeding with null')
    }

    // Use the archive_client function
    const { data, error } = await supabaseAdmin.rpc('archive_client', {
      client_id: params.id,
      admin_id: adminId,
      reason: reason
    })

    if (error) {
      console.error("Error archiving client:", error)

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
    console.error("Archive client API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === "restore") {
      // Try to get admin ID from authenticated session, otherwise use null
      let adminId = null
      try {
        const { data: { user } } = await supabaseAdmin.auth.getUser()
        adminId = user?.id || null
      } catch (err) {
        console.log('Could not get admin user, proceeding with null')
      }

      // Use the restore_client function
      const { data, error } = await supabaseAdmin.rpc('restore_client', {
        client_id: params.id,
        admin_id: adminId
      })

      if (error) {
        console.error("Error restoring client:", error)

        if (error.message.includes("not found") || error.message.includes("not archived")) {
          return NextResponse.json(
            { error: error.message },
            { status: 404 }
          )
        }

        return NextResponse.json(
          { error: "Failed to restore client", details: error.message },
          { status: 500 }
        )
      }

      if (!data) {
        return NextResponse.json(
          { error: "Client not found or not archived" },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        message: "Client restored successfully"
      })
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    )

  } catch (error) {
    console.error("Client action API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}