// app/api/service-requests/route.ts - FIXED VERSION
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
    console.log("Received service request data:", body)

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
      return NextResponse.json(
        { error: "Name, email, service category, title, and description are required" },
        { status: 400 }
      )
    }

    // Create or update client
    let clientId: string
    
    try {
      const { data: existingClient, error: clientSearchError } = await supabaseAdmin
        .from("clients")
        .select("id")
        .eq("email", email.toLowerCase().trim())
        .maybeSingle()

      if (clientSearchError) {
        console.error("Error searching for existing client:", clientSearchError)
        throw new Error("Database error while searching for client")
      }

      if (existingClient) {
        clientId = existingClient.id
        // Update existing client
        const { error: updateError } = await supabaseAdmin
          .from("clients")
          .update({
            name,
            phone: phone || null,
            company: company || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", clientId)

        if (updateError) {
          console.error("Error updating client:", updateError)
          throw new Error("Failed to update client information")
        }
      } else {
        // Create new client
        const { data: newClient, error: clientError } = await supabaseAdmin
          .from("clients")
          .insert({
            name,
            email: email.toLowerCase().trim(),
            phone: phone || null,
            company: company || null,
          })
          .select("id")
          .single()

        if (clientError) {
          console.error("Error creating client:", clientError)
          throw new Error("Failed to create client record")
        }

        clientId = newClient.id
      }

      console.log("Client ID:", clientId)

      // Create service request
      const serviceRequestData = {
        client_id: clientId,
        service_type: service_category,
        request_type: request_type || "digital",
        title,
        description,
        preferred_date: preferred_date || null,
        address: request_type === "on_site" ? site_address : null,
        status: "pending",
      }

      console.log("Creating service request with data:", serviceRequestData)

      const { data: request, error: requestError } = await supabaseAdmin
        .from("service_requests")
        .insert(serviceRequestData)
        .select()
        .single()

      if (requestError) {
        console.error("Error creating service request:", requestError)
        throw new Error("Failed to create service request")
      }

      console.log("Service request created successfully:", request)

      return NextResponse.json({
        success: true,
        message: "Service request submitted successfully",
        request_id: request.id,
      })

    } catch (dbError: any) {
      console.error("Database operation error:", dbError)
      return NextResponse.json(
        { error: dbError.message || "Database error occurred" },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error("Service request API error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}