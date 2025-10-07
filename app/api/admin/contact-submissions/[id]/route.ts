// app/api/admin/contact-submissions/[id]/route.ts - Contact submissions detail API
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

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { data: submission, error } = await supabaseAdmin
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
      .eq("id", params.id)
      .single()

    if (error || !submission) {
      return NextResponse.json({ error: "Contact submission not found" }, { status: 404 })
    }

    return NextResponse.json(submission)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const { status } = body

    // Validate status
    const validStatuses = ['pending', 'completed']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const { data: submission, error } = await supabaseAdmin
      .from("contact_inquiries")
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: "Failed to update contact submission" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Contact submission updated successfully",
      submission,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}