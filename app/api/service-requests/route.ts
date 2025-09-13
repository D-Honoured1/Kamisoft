import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { ServiceRequestForm } from "@/lib/types/database"

export const runtime = "nodejs";


export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body: ServiceRequestForm = await request.json()

    // Validate required fields
    if (!body.name || !body.email || !body.service_category || !body.title || !body.description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // First, create or get the client
    let clientId: string

    // Check if client already exists
    const { data: existingClient } = await supabase.from("clients").select("id").eq("email", body.email).single()

    if (existingClient) {
      clientId = existingClient.id

      // Update client information if provided
      await supabase
        .from("clients")
        .update({
          name: body.name,
          phone: body.phone || null,
          company: body.company || null,
        })
        .eq("id", clientId)
    } else {
      // Create new client
      const { data: newClient, error: clientError } = await supabase
        .from("clients")
        .insert({
          name: body.name,
          email: body.email,
          phone: body.phone || null,
          company: body.company || null,
        })
        .select("id")
        .single()

      if (clientError) {
        console.error("Error creating client:", clientError)
        return NextResponse.json({ error: "Failed to create client record" }, { status: 500 })
      }

      clientId = newClient.id
    }

    const estimatedCost = calculateEstimatedCost(body.service_category, body.request_type)

    // Create the service request
    const { data: serviceRequest, error: requestError } = await supabase
      .from("service_requests")
      .insert({
        client_id: clientId,
        service_category: body.service_category,
        request_type: body.request_type,
        title: body.title,
        description: body.description,
        preferred_date: body.preferred_date || null,
        site_address: body.site_address || null,
        status: "pending",
        estimated_cost: estimatedCost,
      })
      .select("id")
      .single()

    if (requestError) {
      console.error("Error creating service request:", requestError)
      return NextResponse.json({ error: "Failed to create service request" }, { status: 500 })
    }

    // TODO: Send notification email to admin
    // TODO: Send confirmation email to client with payment link

    return NextResponse.json({
      success: true,
      requestId: serviceRequest.id,
      estimatedCost: estimatedCost,
      paymentUrl: `/payment/${serviceRequest.id}`,
      message: "Service request submitted successfully",
    })
  } catch (error) {
    console.error("Error processing service request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function calculateEstimatedCost(serviceCategory: string, requestType: string): number {
  // Base pricing for different service categories
  const basePricing: Record<string, number> = {
    full_stack_development: 2500,
    mobile_app_development: 3000,
    blockchain_solutions: 4000,
    fintech_platforms: 5000,
    networking_ccna: 1500,
    consultancy: 1000,
    cloud_devops: 2000,
    ai_automation: 3500,
  }

  let cost = basePricing[serviceCategory] || 2000

  // Add premium for on-site services
  if (requestType === "on_site") {
    cost += 500
  }

  return cost
}
