// =============================================================================
// FILE: app/api/service-requests/[id]/route.ts (UPDATED VERSION)
// =============================================================================

import { type NextRequest, NextResponse } from "next/server"
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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const { data: serviceRequest, error } = await supabaseAdmin
      .from("service_requests")
      .select(`
        *,
        clients(*),
        payments(*),
        invoices(*)
      `)
      .eq("id", id)
      .single()

    if (error || !serviceRequest) {
      return NextResponse.json({ error: "Service request not found" }, { status: 404 })
    }

    return NextResponse.json(serviceRequest)
  } catch (error) {
    console.error("Error fetching service request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const updates = await request.json()

    // Validate status if provided
    if (updates.status) {
      const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled', 'declined']
      if (!validStatuses.includes(updates.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 })
      }
    }

    // Validate priority if provided
    if (updates.priority) {
      const validPriorities = ['low', 'medium', 'high']
      if (!validPriorities.includes(updates.priority)) {
        return NextResponse.json({ error: "Invalid priority" }, { status: 400 })
      }
    }

    const { data: serviceRequest, error } = await supabaseAdmin
      .from("service_requests")
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating service request:", error)
      return NextResponse.json({ error: "Failed to update service request" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Service request updated successfully",
      serviceRequest
    })
  } catch (error) {
    console.error("Error updating service request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}