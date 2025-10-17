export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getAdminUser } from "@/lib/auth/server-auth"

export async function DELETE(
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

    // Delete the team member
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", params.id)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to delete team member", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Team member deleted successfully",
    })
  } catch (error) {
    console.error("Team member deletion error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
