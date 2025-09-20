// app/api/service-requests/route.ts - UPDATED VERSION
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

    console.log("Service request submission:", { name, email, service_category, title })

    // Validate required fields
    if (!name || !email || !service_category || !title || !description) {
      return NextResponse.json(
        { error: "Name, email, service category, title, and description are required" },
        { status: 400 }
      )
    }

    // First, create or get the client using service role
    let clientId: string
    
    // Check if client already exists
    const { data: existingClient } = await supabaseAdmin
      .from("clients")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle()

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

    // Create the service request
    const { data: request, error: requestError } = await supabaseAdmin
      .from("service_requests")
      .insert({
        client_id: clientId,
        service_type: service_category, // Using service_type to match your existing schema
        request_type: request_type || "digital",
        title,
        description,
        preferred_date: preferred_date || null,
        address: request_type === "on_site" ? site_address : null, // Changed from site_address to address
        status: "pending",
      })
      .select()
      .single()

    if (requestError) {
      console.error("Error creating service request:", requestError)
      return NextResponse.json(
        { error: "Failed to create service request", details: requestError.message },
        { status: 500 }
      )
    }

    console.log("Service request created successfully:", request.id)

    return NextResponse.json({
      success: true,
      message: "Service request submitted successfully",
      request_id: request.id,
    })
  } catch (error: any) {
    console.error("Service request error:", error)
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// Add the missing CORS handling and method support
export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}