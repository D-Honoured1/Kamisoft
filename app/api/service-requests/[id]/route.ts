import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { id } = params

    const { data: serviceRequest, error } = await supabase
      .from("service_requests")
      .select(`
        *,
        client:clients(*),
        payments(*),
        invoices(*)
      `)
      .eq("id", id)
      .single()

    if (error || !serviceRequest) {
      return NextResponse.json({ error: "Service request not found" }, { status: 404 })
    }

    return NextResponse.json(serviceRequest)
  } catch (error) {
    console.error("Error fetching service request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { id } = params
    const updates = await request.json()

    const { data: serviceRequest, error } = await supabase
      .from("service_requests")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating service request:", error)
      return NextResponse.json({ error: "Failed to update service request" }, { status: 500 })
    }

    return NextResponse.json(serviceRequest)
  } catch (error) {
    console.error("Error updating service request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
