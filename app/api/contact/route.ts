// app/api/contact/route.ts - FIXED VERSION
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
    console.log("=== CONTACT FORM SUBMISSION ===")
    console.log("Received data:", JSON.stringify(body, null, 2))

    const { name, email, phone, company, service, subject, message } = body

    // Validate required fields
    if (!name || !email || !message) {
      const missingFields = []
      if (!name) missingFields.push('name')
      if (!email) missingFields.push('email')
      if (!message) missingFields.push('message')
      
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

    // Step 2: Create service request for contact inquiry
    console.log("Step 2: Creating service request for contact inquiry")
    
    const serviceRequestData = {
      client_id: clientId,
      service_category: service || "consultancy", // Use service_category instead of service_type
      request_type: "digital",
      title: subject || "Contact Form Inquiry",
      description: message,
      status: "pending",
      request_source: "contact", // Mark as coming from contact form
    }

    console.log("Contact service request data:", JSON.stringify(serviceRequestData, null, 2))

    try {
      const { data: request, error: requestError } = await supabaseAdmin
        .from("service_requests")
        .insert(serviceRequestData)
        .select()
        .single()

      if (requestError) {
        console.error("Contact service request creation error:", {
          message: requestError.message,
          code: requestError.code,
          details: requestError.details
        })
        throw new Error(`Failed to create contact request: ${requestError.message}`)
      }

      console.log("Contact service request created successfully:", request.id)

      return NextResponse.json({
        success: true,
        message: "Contact form submitted successfully",
        request_id: request.id,
      })

    } catch (requestCreationError: any) {
      console.error("Contact request creation failed:", requestCreationError)
      return NextResponse.json(
        { error: `Contact request creation failed: ${requestCreationError.message}` },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error("=== CONTACT FORM API ERROR ===")
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