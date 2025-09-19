// app/api/service-request/route.ts
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
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

    const supabase = createServerClient()

    // First, create or get the client
    let clientId: string
    
    // Check if client already exists
    const { data: existingClient } = await supabase
      .from("clients")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .single()

    if (existingClient) {
      clientId = existingClient.id
      
      // Update client information if provided
      await supabase
        .from("clients")
        .update({
          name,
          phone: phone || null,
          company: company || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", clientId)
    } else {
      // Create new client
      const { data: newClient, error: clientError } = await supabase
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
        return NextResponse.json(
          { error: "Failed to create client record" },
          { status: 500 }
        )
      }

      clientId = newClient.id
    }

    // Create the service request
    const { data: request, error: requestError } = await supabase
      .from("service_requests")
      .insert({
        client_id: clientId,
        service_type: service_category, // Using service_type to match your existing schema
        request_type: request_type || "digital",
        title,
        description,
        preferred_date: preferred_date || null,
        site_address: request_type === "on_site" ? site_address : null,
        status: "pending",
      })
      .select()
      .single()

    if (requestError) {
      console.error("Error creating service request:", requestError)
      return NextResponse.json(
        { error: "Failed to create service request" },
        { status: 500 }
      )
    }

    // Send notification email (optional - you can implement this later)
    // await sendNotificationEmail(request, { name, email, phone, company })

    return NextResponse.json({
      success: true,
      message: "Service request submitted successfully",
      request_id: request.id,
    })
  } catch (error) {
    console.error("Service request error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}