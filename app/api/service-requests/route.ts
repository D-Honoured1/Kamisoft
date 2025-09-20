// app/api/service-requests/route.ts - FINAL FIXED VERSION
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

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("=== SERVICE REQUEST SUBMISSION ===")
    console.log("Received data:", JSON.stringify(body, null, 2))

    const {
      name,
      email,
      phone,
      company,
      service_category,
      request_type,
      title,
      description,
      preferred_date,
      site_address,
    } = body

    // Validate required fields
    if (!name || !email || !service_category || !title || !description) {
      const missingFields = []
      if (!name) missingFields.push('name')
      if (!email) missingFields.push('email') 
      if (!service_category) missingFields.push('service_category')
      if (!title) missingFields.push('title')
      if (!description) missingFields.push('description')
      
      console.log("Missing required fields:", missingFields)
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Step 1: Create or update client
    let clientId: string
    console.log("Step 1: Looking for existing client with email:", email.toLowerCase().trim())
    
    try {
      const { data: existingClient, error: clientSearchError } = await supabaseAdmin
        .from("clients")
        .select("id")
        .eq("email", email.toLowerCase().trim())
        .maybeSingle()

      if (clientSearchError) {
        console.error("Error searching for client:", clientSearchError)
        throw new Error(`Client search failed: ${clientSearchError.message}`)
      }

      if (existingClient) {
        console.log("Found existing client:", existingClient.id)
        clientId = existingClient.id
        
        // Update existing client
        const updateData = {
          name,
          phone: phone || null,
          company: company || null,
          updated_at: new Date().toISOString(),
        }
        console.log("Updating client with:", updateData)
        
        const { error: updateError } = await supabaseAdmin
          .from("clients")
          .update(updateData)
          .eq("id", clientId)

        if (updateError) {
          console.error("Error updating client:", updateError)
          throw new Error(`Failed to update client: ${updateError.message}`)
        }
        console.log("Client updated successfully")
      } else {
        console.log("Creating new client")
        
        // Create new client
        const newClientData = {
          name,
          email: email.toLowerCase().trim(),
          phone: phone || null,
          company: company || null,
        }
        console.log("Creating client with:", newClientData)

        const { data: newClient, error: clientError } = await supabaseAdmin
          .from("clients")
          .insert(newClientData)
          .select("id")
          .single()

        if (clientError) {
          console.error("Error creating client:", clientError)
          throw new Error(`Failed to create client: ${clientError.message}`)
        }

        clientId = newClient.id
        console.log("New client created with ID:", clientId)
      }

    } catch (clientError: any) {
      console.error("Client operation failed:", clientError)
      return NextResponse.json(
        { error: `Client operation failed: ${clientError.message}` },
        { status: 500 }
      )
    }

    // Step 2: Create service request
    console.log("Step 2: Creating service request")
    
    // Build service request data carefully - only include fields that exist
    const serviceRequestData: any = {
      client_id: clientId,
      service_type: service_category,
      title,
      description,
      status: "pending",
    }

    // Add optional fields only if they have values
    if (request_type) {
      serviceRequestData.request_type = request_type
    }

    if (preferred_date) {
      serviceRequestData.preferred_date = preferred_date
    }

    // Handle address field - check if it exists in your schema
    if (request_type === "on_site" && site_address) {
      // Try different possible column names
      serviceRequestData.site_address = site_address // First try this
      // serviceRequestData.address = site_address // Fallback
    }

    console.log("Service request data to insert:", JSON.stringify(serviceRequestData, null, 2))

    try {
      const { data: request, error: requestError } = await supabaseAdmin
        .from("service_requests")
        .insert(serviceRequestData)
        .select()
        .single()

      if (requestError) {
        console.error("Service request creation error:", {
          message: requestError.message,
          code: requestError.code,
          details: requestError.details,
          hint: requestError.hint
        })

        // If it's a column error, try without the problematic field
        if (requestError.message.includes('column') && site_address) {
          console.log("Retrying without site_address field...")
          delete serviceRequestData.site_address
          delete serviceRequestData.address
          
          const { data: retryRequest, error: retryError } = await supabaseAdmin
            .from("service_requests")
            .insert(serviceRequestData)
            .select()
            .single()

          if (retryError) {
            console.error("Retry also failed:", retryError)
            throw new Error(`Service request creation failed: ${retryError.message}`)
          }

          console.log("Service request created on retry:", retryRequest.id)
          return NextResponse.json({
            success: true,
            message: "Service request submitted successfully (note: site address not saved due to schema)",
            request_id: retryRequest.id,
            warning: "Site address field not supported in current schema"
          })
        }

        throw new Error(`Service request creation failed: ${requestError.message}`)
      }

      console.log("Service request created successfully:", request.id)

      return NextResponse.json({
        success: true,
        message: "Service request submitted successfully",
        request_id: request.id,
      })

    } catch (requestCreationError: any) {
      console.error("Service request creation failed:", requestCreationError)
      return NextResponse.json(
        { error: `Service request creation failed: ${requestCreationError.message}` },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error("=== SERVICE REQUEST API ERROR ===")
    console.error("Error details:", {
      message: error.message,
      stack: error.stack
    })
    
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}