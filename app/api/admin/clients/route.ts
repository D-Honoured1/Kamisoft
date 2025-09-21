// app/api/admin/clients/route.ts
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getAdminUser } from "@/lib/auth/server-auth"

export async function GET() {
  try {
    // Check authentication
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createServerClient()

    const { data: clients, error } = await supabase
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