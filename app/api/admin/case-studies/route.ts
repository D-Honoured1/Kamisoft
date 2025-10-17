export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getAdminUser } from "@/lib/auth/server-auth"

export async function GET() {
  try {
    const supabase = createServerClient()

    const { data: caseStudies, error } = await supabase
      .from("case_studies")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to fetch case studies", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      caseStudies: caseStudies || [],
    })
  } catch (error) {
    console.error("Case studies fetch error:", error)
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

    // Validate required fields
    if (!body.title || !body.description || !body.content || !body.service_category) {
      return NextResponse.json(
        { error: "Title, description, content, and service category are required" },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Insert the new case study
    const { data: caseStudy, error } = await supabase
      .from("case_studies")
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to create case study", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Case study created successfully",
      caseStudy,
    })
  } catch (error) {
    console.error("Case study creation error:", error)
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
      return NextResponse.json({ error: "Case study ID is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Update the case study
    const { data: caseStudy, error } = await supabase
      .from("case_studies")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to update case study", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Case study updated successfully",
      caseStudy,
    })
  } catch (error) {
    console.error("Case study update error:", error)
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
    const caseStudyId = searchParams.get("id")

    if (!caseStudyId) {
      return NextResponse.json({ error: "Case study ID is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Delete the case study
    const { error } = await supabase
      .from("case_studies")
      .delete()
      .eq("id", caseStudyId)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to delete case study", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Case study deleted successfully",
    })
  } catch (error) {
    console.error("Case study deletion error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
