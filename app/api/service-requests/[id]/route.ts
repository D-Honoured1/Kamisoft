// app/api/service-requests/[id]/route.ts - COMPLETE WORKING VERSION
export const dynamic = "force-dynamic"

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

    console.log("Fetching service request with ID:", id)

    const { data: serviceRequest, error } = await supabaseAdmin
      .from("service_requests")
      .select(`
        *,
        clients (
          id,
          name,
          email,
          phone,
          company
        ),
        payments (
          id,
          amount,
          currency,
          payment_method,
          payment_status,
          created_at
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Service request not found" }, { status: 404 })
    }

    if (!serviceRequest) {
      console.log("No service request found with ID:", id)
      return NextResponse.json({ error: "Service request not found" }, { status: 404 })
    }

    console.log("Service request found successfully")
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

    console.log("Updating service request:", id, "with data:", updates)

    // Validate status if provided
    if (updates.status) {
      const validStatuses = ['pending', 'approved', 'in_progress', 'completed', 'cancelled', 'declined']
      if (!validStatuses.includes(updates.status)) {
        return NextResponse.json({ error: "Invalid status. Valid options: " + validStatuses.join(', ') }, { status: 400 })
      }
    }

    // Validate priority if provided
    if (updates.priority) {
      const validPriorities = ['low', 'medium', 'high']
      if (!validPriorities.includes(updates.priority)) {
        return NextResponse.json({ error: "Invalid priority. Valid options: " + validPriorities.join(', ') }, { status: 400 })
      }
    }

    // Validate estimated_cost if provided
    if (updates.estimated_cost !== undefined && updates.estimated_cost !== null) {
      const cost = parseFloat(updates.estimated_cost)
      if (isNaN(cost) || cost < 0) {
        return NextResponse.json({ error: "Invalid estimated cost" }, { status: 400 })
      }
      updates.estimated_cost = cost
    }

    const { data: serviceRequest, error } = await supabaseAdmin
      .from("service_requests")
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select(`
        *,
        clients (
          id,
          name,
          email,
          phone,
          company
        )
      `)
      .single()

    if (error) {
      console.error("Error updating service request:", error)
      return NextResponse.json({ error: "Failed to update service request: " + error.message }, { status: 500 })
    }

    if (!serviceRequest) {
      return NextResponse.json({ error: "Service request not found" }, { status: 404 })
    }

    console.log("Service request updated successfully")
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