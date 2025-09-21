// app/api/service-requests/[id]/route.ts - DEBUG VERSION
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

    console.log("=== DEBUG: Service Request API ===")
    console.log("Requested ID:", id)
    console.log("ID type:", typeof id)
    console.log("ID length:", id.length)

    // First, let's check if ANY service requests exist
    const { data: allRequests, error: allError, count } = await supabaseAdmin
      .from("service_requests")
      .select("id", { count: "exact" })
      .limit(5)

    console.log("Total service requests:", count)
    console.log("All request IDs:", allRequests?.map(r => r.id))
    console.log("All requests error:", allError)

    // Now try to find the specific one
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
        )
      `)
      .eq("id", id)
      .single()

    console.log("Specific query error:", error)
    console.log("Service request found:", !!serviceRequest)
    console.log("Service request data:", serviceRequest)

    if (error) {
      console.error("Database error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      
      return NextResponse.json({ 
        error: "Service request not found",
        debug: {
          requested_id: id,
          total_requests: count,
          all_ids: allRequests?.map(r => r.id),
          error_details: error
        }
      }, { status: 404 })
    }

    if (!serviceRequest) {
      return NextResponse.json({ 
        error: "Service request not found",
        debug: {
          requested_id: id,
          total_requests: count,
          all_ids: allRequests?.map(r => r.id)
        }
      }, { status: 404 })
    }

    console.log("Service request found successfully")
    return NextResponse.json(serviceRequest)
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      debug: {
        error_message: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 })
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
      return NextResponse.json({ error: "Failed to update service request: " + error.message }, { status: 500 })
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