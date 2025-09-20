// app/api/contact/route.ts - UPDATED VERSION
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a service role client for bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // This bypasses RLS
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
    const { name, email, phone, company, message, subject } = body

    console.log("Contact form submission:", { name, email, subject })

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      )
    }

    // First, create or update the client using service role
    let clientId: string
    
    // Check if client already exists
    const { data: existingClient } = await supabaseAdmin
      .from("clients")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .single()

    if (existingClient) {
      clientId = existingClient.id
      
      // Update client information if provided
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
        return NextResponse.json(
          { error: "Failed to create client record", details: clientError.message },
          { status: 500 }
        )
      }

      clientId = newClient.id
    }

    // Create a service request for the contact inquiry
    const { data: request, error: requestError } = await supabaseAdmin
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
        { error: "Failed to create contact request", details: requestError.message },
        { status: 500 }
      )
    }

    console.log("Contact request created successfully:", request.id)

    return NextResponse.json({
      success: true,
      message: "Contact form submitted successfully",
      request_id: request.id,
    })
  } catch (error: any) {
    console.error("Contact form error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}