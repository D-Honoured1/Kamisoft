export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAdminUser } from "@/lib/auth/server-auth"
import { cleanupPortfolioImages } from "@/lib/storage-cleanup"

export async function GET(req: Request) {
  try {
    // Check authentication
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get("id")

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Fetch the specific portfolio project
    const { data: project, error } = await supabase
      .from("portfolio_projects")
      .select("*")
      .eq("id", projectId)
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to fetch portfolio project", details: error.message },
        { status: 500 }
      )
    }

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      project,
    })
  } catch (error) {
    console.error("Portfolio fetch error:", error)
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
      title,
      description,
      service_category,
      client_name,
      project_url,
      github_url,
      featured_image_url,
      technologies,
      completion_date,
      is_featured,
      is_published,
      // New client feedback fields
      client_feedback,
      client_rating,
      feedback_date,
    } = body

    // Validate required fields
    if (!title || !description || !service_category) {
      return NextResponse.json(
        { error: "Title, description, and service category are required" },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Insert the new portfolio project
    const { data: project, error } = await supabase
      .from("portfolio_projects")
      .insert({
        title,
        description,
        service_category,
        client_name: client_name || null,
        project_url: project_url || null,
        github_url: github_url || null,
        featured_image_url: featured_image_url || null,
        technologies: technologies || [],
        completion_date: completion_date || null,
        is_featured: is_featured || false,
        is_published: is_published !== undefined ? is_published : true,
        client_feedback: client_feedback || null,
        client_rating: client_rating || null,
        feedback_date: feedback_date || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to create portfolio project", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Portfolio project created successfully",
      project,
    })
  } catch (error) {
    console.error("Portfolio creation error:", error)
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
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Update the portfolio project
    const { data: project, error } = await supabase
      .from("portfolio_projects")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to update portfolio project", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Portfolio project updated successfully",
      project,
    })
  } catch (error) {
    console.error("Portfolio update error:", error)
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
    const projectId = searchParams.get("id")

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Clean up associated images before deleting the record
    await cleanupPortfolioImages(projectId)

    // Delete the portfolio project
    const { error } = await supabase
      .from("portfolio_projects")
      .delete()
      .eq("id", projectId)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to delete portfolio project", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Portfolio project deleted successfully",
    })
  } catch (error) {
    console.error("Portfolio deletion error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}