// app/api/admin/clients/route.ts - UPDATED VERSION WITH CONTACT INQUIRIES
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

export async function GET() {
  try {
    const { data: clients, error } = await supabaseAdmin
      .from("clients")
      .select(`
        id,
        name,
        email,
        phone,
        company,
        created_at,
        updated_at,
        service_requests (
          id,
          request_source,
          status,
          service_category,
          created_at
        ),
        contact_inquiries (
          id,
          status,
          subject,
          created_at
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching clients:", error)
      return NextResponse.json(
        { error: "Failed to fetch clients", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      clients: clients || [],
      total: clients?.length || 0,
    })
  } catch (error) {
    console.error("Clients API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}