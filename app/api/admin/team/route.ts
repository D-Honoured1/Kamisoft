export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getAdminUser } from "@/lib/auth/server-auth"

export async function GET() {
  try {
    const supabase = createServerClient()

    const { data: team, error } = await supabase
      .from("team_members")
      .select("*")
      .order("display_order", { ascending: true })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to fetch team members", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      team: team || [],
    })
  } catch (error) {
    console.error("Team fetch error:", error)
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
      full_name,
      display_name,
      position,
      department,
      bio,
      short_bio,
      years_of_experience,
      specializations,
      certifications,
      education,
      email,
      phone,
      linkedin_url,
      github_url,
      twitter_url,
      portfolio_url,
      profile_image_url,
      profile_image_alt,
      cover_image_url,
      team_type,
      is_public,
      is_featured,
      display_order,
      employment_status,
      joined_date,
    } = body

    // Validate required fields
    if (!full_name || !position) {
      return NextResponse.json(
        { error: "Full name and position are required" },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Insert the new team member
    const { data: member, error } = await supabase
      .from("team_members")
      .insert({
        full_name,
        display_name: display_name || null,
        position,
        department: department || null,
        bio: bio || null,
        short_bio: short_bio || null,
        years_of_experience: years_of_experience || null,
        specializations: specializations || null,
        certifications: certifications || null,
        education: education || null,
        email: email || null,
        phone: phone || null,
        linkedin_url: linkedin_url || null,
        github_url: github_url || null,
        twitter_url: twitter_url || null,
        portfolio_url: portfolio_url || null,
        profile_image_url: profile_image_url || null,
        profile_image_alt: profile_image_alt || null,
        cover_image_url: cover_image_url || null,
        team_type: team_type || "staff",
        is_public: is_public !== undefined ? is_public : true,
        is_featured: is_featured || false,
        display_order: display_order || 0,
        employment_status: employment_status || "active",
        joined_date: joined_date || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to create team member", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Team member created successfully",
      member,
    })
  } catch (error) {
    console.error("Team member creation error:", error)
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

    // Update the team member
    const { data: member, error } = await supabase
      .from("team_members")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to update team member", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Team member updated successfully",
      member,
    })
  } catch (error) {
    console.error("Team member update error:", error)
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

    // Delete the team member
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", memberId)

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
