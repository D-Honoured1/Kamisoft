// app/api/debug/service-requests/route.ts - DEBUG ENDPOINT
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
    console.log("=== DEBUG: Service Requests ===")

    // Check if service_requests table exists and get sample data
    const { data: requests, error, count } = await supabaseAdmin
      .from("service_requests")
      .select("*", { count: "exact" })
      .limit(5)

    const result = {
      timestamp: new Date().toISOString(),
      table_exists: !error,
      total_count: count,
      error_message: error?.message || null,
      sample_requests: requests || [],
      sample_ids: requests?.map(r => r.id) || [],
    }

    if (error) {
      console.error("Service requests table error:", error)
    } else {
      console.log("Service requests found:", count)
      console.log("Sample IDs:", result.sample_ids)
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Debug error:", error)
    return NextResponse.json({
      error: "Debug failed",
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}