// app/api/contact/route.ts - FIXED VERSION WITH SEPARATE CONTACT_INQUIRIES TABLE
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

    const { name, email, phone, company, service, subject, message } = body

    // Validate required fields
    if (!name || !email || !message) {
      const missingFields = []
      if (!name) missingFields.push('name')
      if (!email) missingFields.push('email')
      if (!message) missingFields.push('message')
      
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

    // Step 2: Create contact inquiry (separate from service requests)
    
    const contactInquiryData = {
      client_id: clientId,
      service_category: service || null,
      subject: subject || "Contact Form Inquiry",
      message: message,
      status: "pending",
    }


    try {
      const { data: inquiry, error: inquiryError } = await supabaseAdmin
        .from("contact_inquiries")
        .insert(contactInquiryData)
        .select()
        .single()

      if (inquiryError) {
        throw new Error(`Failed to create contact inquiry: ${inquiryError.message}`)
      }


      // Step 3: Send email notifications
      try {
        // Send notification to admin
        const adminEmailResult = await emailService.sendContactFormNotification({
          name,
          email,
          phone,
          company,
          service,
          subject: subject || "Contact Form Inquiry",
          message
        })

        // Send confirmation to user
        const confirmationEmailResult = await emailService.sendContactConfirmation({
          name,
          email,
          phone,
          company,
          service,
          subject: subject || "Contact Form Inquiry",
          message
        })

        console.log('Admin email result:', adminEmailResult)
        console.log('Confirmation email result:', confirmationEmailResult)

      } catch (emailError: any) {
        console.error('Email sending failed:', emailError)
        // Don't fail the entire request if email fails
      }

      return NextResponse.json({
        success: true,
        message: "Contact form submitted successfully",
        inquiry_id: inquiry.id,
      })

    } catch (inquiryCreationError: any) {
      return NextResponse.json(
        { error: `Contact inquiry creation failed: ${inquiryCreationError.message}` },
        { status: 500 }
      )
    }

  } catch (error: any) {
    
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}