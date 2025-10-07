export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getAdminUser } from "@/lib/auth/server-auth"
import { cleanupLeadershipImages } from "@/lib/storage-cleanup"

export async function GET() {
  try {
    const supabase = createServerClient()

    const { data: leadership, error } = await supabase
      .from("leadership_team")
      .select("*")
      .order("display_order", { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch leadership team", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      leadership: leadership || [],
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    // Check authentication
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      name,
      position,
      bio,
      email,
      linkedin_url,
      twitter_url,
      profile_image_url,
      display_order,
      is_active,
    } = body

    // Validate required fields
    if (!name || !position) {
      return NextResponse.json(
        { error: "Name and position are required" },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Insert the new leadership member
    const { data: member, error } = await supabase
      .from("leadership_team")
      .insert({
        name,
        position,
        bio: bio || null,
        email: email || null,
        linkedin_url: linkedin_url || null,
        twitter_url: twitter_url || null,
        profile_image_url: profile_image_url || null,
        display_order: display_order || 0,
        is_active: is_active !== undefined ? is_active : true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: "Failed to create leadership member", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Leadership member created successfully",
      member,
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    // Check authentication
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Update the leadership member
    const { data: member, error } = await supabase
      .from("leadership_team")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: "Failed to update leadership member", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Leadership member updated successfully",
      member,
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    // Check authentication
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const memberId = searchParams.get("id")

    if (!memberId) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Clean up associated images before deleting the record
    await cleanupLeadershipImages(memberId)

    // Delete the leadership member
    const { error } = await supabase
      .from("leadership_team")
      .delete()
      .eq("id", memberId)

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete leadership member", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Leadership member deleted successfully",
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}