// app/api/admin/products/[id]/route.ts
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getAdminUser } from "@/lib/auth/server-auth"

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[DELETE] Attempting to delete product: ${params.id}`)

    // Check admin authentication
    const adminUser = await getAdminUser()
    if (!adminUser) {
      console.log("[DELETE] Unauthorized - no admin user")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`[DELETE] Authenticated as: ${adminUser.email}`)

    const supabase = createServerClient()

    // Delete the product
    const { error, data } = await supabase
      .from("products")
      .delete()
      .eq("id", params.id)
      .select()

    if (error) {
      console.error("[DELETE] Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to delete product", details: error.message },
        { status: 500 }
      )
    }

    console.log("[DELETE] Delete successful:", data)
    return NextResponse.json({ success: true, deleted: data })
  } catch (error: any) {
    console.error("[DELETE] Exception:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const supabase = createServerClient()

    // Update the product
    const { data, error } = await supabase
      .from("products")
      .update({
        name: body.name,
        description: body.description,
        short_description: body.short_description,
        price: body.price,
        currency: body.currency,
        category: body.category,
        features: body.features,
        image_url: body.image_url,
        is_published: body.is_published,
        is_featured: body.is_featured,
        stock_status: body.stock_status,
        demo_url: body.demo_url,
        documentation_url: body.documentation_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating product:", error)
      return NextResponse.json(
        { error: "Failed to update product" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in PATCH /api/admin/products/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
