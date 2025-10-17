export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getAdminUser } from "@/lib/auth/server-auth"

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createServerClient()

    // Verify the testimonial
    const { data: testimonial, error } = await supabase
      .from("testimonials")
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
        verified_by_admin_id: adminUser.id,
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to verify testimonial", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Testimonial verified successfully",
      testimonial,
    })
  } catch (error) {
    console.error("Testimonial verification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
