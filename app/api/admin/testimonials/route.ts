export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getAdminUser } from "@/lib/auth/server-auth"

export async function GET() {
  try {
    const supabase = createServerClient()

    const { data: testimonials, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("display_order", { ascending: true })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to fetch testimonials", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      testimonials: testimonials || [],
    })
  } catch (error) {
    console.error("Testimonials fetch error:", error)
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
    if (!body.client_name || !body.message) {
      return NextResponse.json(
        { error: "Client name and message are required" },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Insert the new testimonial
    const { data: testimonial, error } = await supabase
      .from("testimonials")
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to create testimonial", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Testimonial created successfully",
      testimonial,
    })
  } catch (error) {
    console.error("Testimonial creation error:", error)
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
      return NextResponse.json({ error: "Testimonial ID is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Update the testimonial
    const { data: testimonial, error } = await supabase
      .from("testimonials")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to update testimonial", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Testimonial updated successfully",
      testimonial,
    })
  } catch (error) {
    console.error("Testimonial update error:", error)
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
    const testimonialId = searchParams.get("id")

    if (!testimonialId) {
      return NextResponse.json({ error: "Testimonial ID is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Delete the testimonial
    const { error } = await supabase
      .from("testimonials")
      .delete()
      .eq("id", testimonialId)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to delete testimonial", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Testimonial deleted successfully",
    })
  } catch (error) {
    console.error("Testimonial deletion error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
