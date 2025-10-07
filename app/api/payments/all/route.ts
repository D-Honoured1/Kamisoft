// app/api/admin/payments/all/route.ts - Get all payments for admin management
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getAdminUser } from "@/lib/auth/server-auth"

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
    // Check admin authentication
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: payments, error } = await supabaseAdmin
      .from("payments")
      .select(`
        *,
        service_requests (
          id,
          title,
          clients (
            id,
            name,
            email,
            company
          )
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch payments" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      payments: payments || [],
      total: payments?.length || 0,
    })
  } catch (error: any) {
    return NextResponse.json({
      error: "Internal server error",
      details: error.message
    }, { status: 500 })
  }
}