import { NextResponse } from "next/server"
import { getAllProducts } from "@/lib/queries/content"

export async function GET() {
  try {
    const products = await getAllProducts({ active_only: true })
    return NextResponse.json({ success: true, products })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    )
  }
}
