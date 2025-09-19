// app/api/contact/route.ts
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, phone, company, message, subject } = body

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // First, create or update the client
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

    // Create a service request for the contact inquiry
    const { data: request, error: requestError } = await supabase
      .from("service_requests")
      .insert({
        client_id: clientId,
        service_type: "consultancy", // Using consultancy for general inquiries
        request_type: "digital",
        title: subject || "Contact Form Inquiry",
        description: message,
        status: "pending",
      })
      .select()
      .single()

    if (requestError) {
      console.error("Error creating contact request:", requestError)
      return NextResponse.json(
        { error: "Failed to create contact request" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Contact form submitted successfully",
      request_id: request.id,
    })
  } catch (error) {
    console.error("Contact form error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}