// app/api/admin/payments/[id]/route.ts - Update specific payment
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

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    // Check admin authentication
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .select(`
        *,
        service_requests (
          id,
          title,
          estimated_cost,
          clients (
            id,
            name,
            email,
            company
          )
        )
      `)
      .eq("id", params.id)
      .single()

    if (error || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    return NextResponse.json(payment)
  } catch (error) {
    console.error("Error fetching payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    // Check admin authentication
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { payment_status, admin_notes, confirmed_at } = await request.json()

    if (!payment_status) {
      return NextResponse.json({ error: "payment_status is required" }, { status: 400 })
    }

    // Validate payment status
    const validStatuses = ['pending', 'processing', 'confirmed', 'declined', 'failed', 'refunded']
    if (!validStatuses.includes(payment_status)) {
      return NextResponse.json({ error: "Invalid payment status" }, { status: 400 })
    }

    const updateData: any = {
      payment_status,
      updated_at: new Date().toISOString()
    }

    if (admin_notes) {
      updateData.admin_notes = admin_notes
    }

    if (confirmed_at) {
      updateData.confirmed_at = confirmed_at
      updateData.confirmed_by = adminUser.email
    }

    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating payment:", error)
      return NextResponse.json({ error: "Failed to update payment" }, { status: 500 })
    }

    // If payment is confirmed, trigger any additional actions
    if (payment_status === "confirmed") {
      try {
        // Update service request status to in_progress if this was the first payment
        const { data: serviceRequest } = await supabaseAdmin
          .from("service_requests")
          .select("status, estimated_cost")
          .eq("id", payment.request_id)
          .single()

        if (serviceRequest && serviceRequest.status === "approved") {
          await supabaseAdmin
            .from("service_requests")
            .update({ 
              status: "in_progress",
              updated_at: new Date().toISOString()
            })
            .eq("id", payment.request_id)
        }

        // TODO: Send confirmation email to client
        // TODO: Generate invoice
        // TODO: Notify project team
      } catch (error) {
        console.error("Error with post-confirmation actions:", error)
        // Don't fail the main request, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment updated successfully",
      payment
    })
  } catch (error) {
    console.error("Payment update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}