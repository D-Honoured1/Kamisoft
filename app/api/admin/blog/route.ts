export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getAdminUser } from "@/lib/auth/server-auth"

export async function GET() {
  try {
    const supabase = createServerClient()

    const { data: posts, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to fetch blog posts", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      posts: posts || [],
    })
  } catch (error) {
    console.error("Blog posts fetch error:", error)
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
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Insert the new blog post
    const { data: post, error } = await supabase
      .from("blog_posts")
      .insert({
        ...body,
        author_id: adminUser.id,
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to create blog post", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Blog post created successfully",
      post,
    })
  } catch (error) {
    console.error("Blog post creation error:", error)
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
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Update the blog post
    const { data: post, error } = await supabase
      .from("blog_posts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to update blog post", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Blog post updated successfully",
      post,
    })
  } catch (error) {
    console.error("Blog post update error:", error)
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
    const postId = searchParams.get("id")

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Delete the blog post
    const { error } = await supabase
      .from("blog_posts")
      .delete()
      .eq("id", postId)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to delete blog post", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Blog post deleted successfully",
    })
  } catch (error) {
    console.error("Blog post deletion error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
