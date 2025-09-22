// app/api/service-requests/[id]/route.ts - FIXED VERSION WITH CORRECT FOREIGN KEY SYNTAX
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

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { id } = context.params
    console.log("Fetching service request with ID:", id)
    
    // FIXED: Use proper foreign key relationship syntax
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
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: "Service request not found", details: error.message }, 
        { status: 404 }
      )
    }

    if (!serviceRequest) {
      console.log("No service request found for ID:", id)
      return NextResponse.json(
        { error: "Service request not found" }, 
        { status: 404 }
      )
    }

    console.log("Service request found:", serviceRequest.id)
    return NextResponse.json(serviceRequest)
  } catch (error: any) {
    console.error("Error fetching service request:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message }, 
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    const { id } = context.params
    console.log("Updating service request with ID:", id)
    
    const updates = await request.json()
    console.log("Updates:", updates)

    // Validate status if provided
    if (updates.status) {
      const validStatuses = ['pending', 'approved', 'in_progress', 'completed', 'cancelled', 'declined']
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

    // Validate estimated_cost if provided
    if (updates.estimated_cost !== undefined && updates.estimated_cost !== null) {
      const cost = parseFloat(updates.estimated_cost)
      if (isNaN(cost) || cost < 0) {
        return NextResponse.json({ error: "Invalid estimated cost" }, { status: 400 })
      }
      updates.estimated_cost = cost
    }

    // FIXED: Use proper foreign key relationship syntax for update
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
      console.error("Update error:", error)
      return NextResponse.json(
        { error: "Failed to update service request", details: error.message }, 
        { status: 500 }
      )
    }

    if (!serviceRequest) {
      return NextResponse.json(
        { error: "Service request not found" }, 
        { status: 404 }
      )
    }

    console.log("Service request updated successfully")
    return NextResponse.json({
      success: true,
      message: "Service request updated successfully",
      serviceRequest
    })
  } catch (error: any) {
    console.error("Error updating service request:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message }, 
      { status: 500 }
    )
  }
}