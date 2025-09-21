// app/api/contact/route.ts - FIXED VERSION WITH SEPARATE CONTACT_INQUIRIES TABLE
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

    // Step 2: Create contact inquiry (separate from service requests)
    console.log("Step 2: Creating contact inquiry")
    
    const contactInquiryData = {
      client_id: clientId,
      service_category: service || null,
      subject: subject || "Contact Form Inquiry",
      message: message,
      status: "pending",
    }

    console.log("Contact inquiry data:", JSON.stringify(contactInquiryData, null, 2))

    try {
      const { data: inquiry, error: inquiryError } = await supabaseAdmin
        .from("contact_inquiries")
        .insert(contactInquiryData)
        .select()
        .single()

      if (inquiryError) {
        console.error("Contact inquiry creation error:", {
          message: inquiryError.message,
          code: inquiryError.code,
          details: inquiryError.details
        })
        throw new Error(`Failed to create contact inquiry: ${inquiryError.message}`)
      }

      console.log("Contact inquiry created successfully:", inquiry.id)

      return NextResponse.json({
        success: true,
        message: "Contact form submitted successfully",
        inquiry_id: inquiry.id,
      })

    } catch (inquiryCreationError: any) {
      console.error("Contact inquiry creation failed:", inquiryCreationError)
      return NextResponse.json(
        { error: `Contact inquiry creation failed: ${inquiryCreationError.message}` },
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