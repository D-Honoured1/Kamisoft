import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { ServiceRequestForm } from "@/lib/types/database"

export async function POST(request: NextRequest) {
  try {
    // Log the incoming request
    console.log("API Request received")
    
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const body: ServiceRequestForm = await request.json()
    
    // Log the received data
    console.log("Request data:", body)

    // Validate required fields
    if (!body.name || !body.email || !body.service_category || !body.title || !body.description) {
      console.log("Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // First, create or get the client
    let clientId: string

    // Check if client already exists
    const { data: existingClient, error: clientCheckError } = await supabase
      .from("clients")
      .select("id")
      .eq("email", body.email)
      .single()

    if (clientCheckError) {
      console.error("Error checking client:", clientCheckError)
      // If there's an error checking, proceed to create a new client
    }

    if (existingClient) {
      clientId = existingClient.id
      console.log("Existing client found:", clientId)

      // Update client information if provided
      const { error: updateError } = await supabase
        .from("clients")
        .update({
          name: body.name,
          phone: body.phone || null,
          company: body.company || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", clientId)

      if (updateError) {
        console.error("Error updating client:", updateError)
        return NextResponse.json({ error: "Failed to update client record" }, { status: 500 })
      }
    } else {
      console.log("Creating new client")
      // Create new client
      const { data: newClient, error: clientError } = await supabase
        .from("clients")
        .insert({
          name: body.name,
          email: body.email,
          phone: body.phone || null,
          company: body.company || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single()

      if (clientError) {
        console.error("Error creating client:", clientError)
        return NextResponse.json({ error: "Failed to create client record" }, { status: 500 })
      }

      clientId = newClient.id
      console.log("New client created:", clientId)
    }

    const estimatedCost = calculateEstimatedCost(body.service_category, body.request_type)
    console.log("Estimated cost:", estimatedCost)

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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (requestError) {
      console.error("Error creating service request:", requestError)
      return NextResponse.json({ error: "Failed to create service request" }, { status: 500 })
    }

    console.log("Service request created:", serviceRequest.id)

    return NextResponse.json({
      success: true,
      requestId: serviceRequest.id,
      estimatedCost: estimatedCost,
      paymentUrl: `/payment/${serviceRequest.id}`,
      message: "Service request submitted successfully",
    })
  } catch (error) {
    console.error("Unexpected error processing service request:", error)
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