// =============================================================================
// FILE: app/api/admin/contact-submissions/route.ts (LIST ALL CONTACT SUBMISSIONS)
// =============================================================================

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
    const { data: submissions, error } = await supabaseAdmin
      .from("contact_inquiries")
      .select(`
        *,
        clients (
          id,
          name,
          email,
          phone,
          company
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching contact submissions:", error)
      return NextResponse.json(
        { error: "Failed to fetch contact submissions" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      submissions: submissions || [],
      total: submissions?.length || 0,
    })
  } catch (error) {
    console.error("Contact submissions API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}