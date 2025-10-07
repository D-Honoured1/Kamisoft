// app/api/admin/payments/route.ts - Get payments for a request
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

export async function GET(request: Request) {
  try {
    // Check admin authentication
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get("request_id")

    if (!requestId) {
      return NextResponse.json({ error: "request_id parameter required" }, { status: 400 })
    }

    // Check if we should include deleted payments
    const includeDeleted = searchParams.get('include_deleted') === 'true'

    let query = supabaseAdmin
      .from("payments")
      .select("*")
      .eq("request_id", requestId)

    // Filter out soft-deleted payments unless specifically requested
    if (!includeDeleted) {
      query = query.neq('payment_status', 'deleted')
    }

    const { data: payments, error } = await query
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching payments:", error)
      return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      payments: payments || []
    })
  } catch (error) {
    console.error("Payments API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}