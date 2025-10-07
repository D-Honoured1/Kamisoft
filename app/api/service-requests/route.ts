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
      
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Step 1: Create or update client
    let clientId: string
    
    try {
      const { data: existingClient, error: clientSearchError } = await supabaseAdmin
        .from("clients")
        .select("id")
        .eq("email", email.toLowerCase().trim())
        .maybeSingle()

      if (clientSearchError) {
        throw new Error(`Client search failed: ${clientSearchError.message}`)
      }

      if (existingClient) {
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
          throw new Error(`Failed to update client: ${updateError.message}`)
        }
      } else {
        
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
          throw new Error(`Failed to create client: ${clientError.message}`)
        }

        clientId = newClient.id
      }

    } catch (clientError: any) {
      return NextResponse.json(
        { error: `Client operation failed: ${clientError.message}` },
        { status: 500 }
      )
    }

    // Step 2: Create service request
    
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


    try {
      const { data: request, error: requestError } = await supabaseAdmin
        .from("service_requests")
        .insert(serviceRequestData)
        .select()
        .single()

      if (requestError) {
          message: requestError.message,
          code: requestError.code,
          details: requestError.details,
          hint: requestError.hint
        })
        throw new Error(`Service request creation failed: ${requestError.message}`)
      }


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


      } catch (emailError: any) {
        // Don't fail the entire request if email fails
      }

      return NextResponse.json({
        success: true,
        message: "Service request submitted successfully",
        request_id: request.id,
      })

    } catch (requestCreationError: any) {
      return NextResponse.json(
        { error: `Service request creation failed: ${requestCreationError.message}` },
        { status: 500 }
      )
    }

  } catch (error: any) {
      message: error.message,
      stack: error.stack
    })
    
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}