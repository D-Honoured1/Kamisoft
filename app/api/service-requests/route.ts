// app/api/service-requests/route.ts - FIXED VERSION WITH EMAIL NOTIFICATIONS
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { emailService } from "@/lib/email"

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
      service_category, // This is the correct field name
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
    
    const serviceRequestData = {
      client_id: clientId,
      service_category, // Use service_category instead of service_type
      request_type: request_type || "digital",
      title,
      description,
      status: "pending",
      request_source: "hire_us", // Mark as coming from hire us form
      preferred_date: preferred_date || null,
      site_address: (request_type === "on_site" && site_address) ? site_address : null,
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
        throw new Error(`Service request creation failed: ${requestError.message}`)
      }

      console.log("Service request created successfully:", request.id)

      // Step 3: Send email notifications
      try {
        // Send notification to admin
        const adminEmailResult = await emailService.sendServiceRequestNotification({
          name,
          email,
          phone,
          company,
          service_category,
          request_type: request_type || "digital",
          title,
          description,
          preferred_date,
          site_address
        })

        // Send confirmation to user
        const confirmationEmailResult = await emailService.sendServiceRequestConfirmation({
          name,
          email,
          phone,
          company,
          service_category,
          request_type: request_type || "digital",
          title,
          description,
          preferred_date,
          site_address
        })

        console.log('Admin email result:', adminEmailResult)
        console.log('Confirmation email result:', confirmationEmailResult)

      } catch (emailError: any) {
        console.error('Email sending failed:', emailError)
        // Don't fail the entire request if email fails
      }

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
<<<<<<< HEAD
=======
    console.error("=== SERVICE REQUEST API ERROR ===")
    console.error("Error details:", {
      message: error.message,
      stack: error.stack
    })
    
>>>>>>> parent of d5918f5 (Let me breath)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}