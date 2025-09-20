// app/api/contact/route.ts
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
    const { name, email, phone, company, message, subject } = body

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      )
    }

    // Create or update client
    let clientId: string
    
    const { data: existingClient } = await supabaseAdmin
      .from("clients")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .single()

    if (existingClient) {
      clientId = existingClient.id
      await supabaseAdmin
        .from("clients")
        .update({
          name,
          phone: phone || null,
          company: company || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", clientId)
    } else {
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
        return NextResponse.json(
          { error: "Failed to create client record" },
          { status: 500 }
        )
      }

      clientId = newClient.id
    }

    // Create service request for contact inquiry
    const { data: request, error: requestError } = await supabaseAdmin
      .from("service_requests")
      .insert({
        client_id: clientId,
        service_type: "consultancy",
        request_type: "digital",
        title: subject || "Contact Form Inquiry",
        description: message,
        status: "pending",
      })
      .select()
      .single()

    if (requestError) {
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
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}