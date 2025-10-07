export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getAdminUser } from "@/lib/auth/server-auth"

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')
    const bucket = searchParams.get('bucket')

    if (!imageUrl || !bucket) {
      return NextResponse.json(
        { error: "Image URL and bucket are required" },
        { status: 400 }
      )
    }

    // Extract filename from URL
    const urlParts = imageUrl.split('/')
    const fileName = urlParts[urlParts.length - 1]

    if (!fileName) {
      return NextResponse.json(
        { error: "Could not extract filename from URL" },
        { status: 400 }
      )
    }

    // Use service role client to bypass RLS for authenticated admin deletes
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Delete from Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from(bucket)
      .remove([fileName])

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete file from storage" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "File deleted successfully"
    })

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}