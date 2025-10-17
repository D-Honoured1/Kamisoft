export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getAdminUser } from "@/lib/auth/server-auth"

export async function GET() {
  try {
    const supabase = createServerClient()

    const { data: faqs, error } = await supabase
      .from("faqs")
      .select("*")
      .order("category", { ascending: true })
      .order("display_order", { ascending: true })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to fetch FAQs", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      faqs: faqs || [],
    })
  } catch (error) {
    console.error("FAQs fetch error:", error)
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
    if (!body.question || !body.answer || !body.category) {
      return NextResponse.json(
        { error: "Question, answer, and category are required" },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Insert the new FAQ
    const { data: faq, error } = await supabase
      .from("faqs")
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to create FAQ", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "FAQ created successfully",
      faq,
    })
  } catch (error) {
    console.error("FAQ creation error:", error)
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
      return NextResponse.json({ error: "FAQ ID is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Update the FAQ
    const { data: faq, error } = await supabase
      .from("faqs")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to update FAQ", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "FAQ updated successfully",
      faq,
    })
  } catch (error) {
    console.error("FAQ update error:", error)
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
    const faqId = searchParams.get("id")

    if (!faqId) {
      return NextResponse.json({ error: "FAQ ID is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Delete the FAQ
    const { error } = await supabase
      .from("faqs")
      .delete()
      .eq("id", faqId)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to delete FAQ", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "FAQ deleted successfully",
    })
  } catch (error) {
    console.error("FAQ deletion error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
