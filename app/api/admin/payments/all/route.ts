// app/api/admin/payments/all/route.ts
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getAdminUser } from "@/lib/auth/server-auth"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(req: Request) {
  try {
    // Check admin authentication
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = searchParams.get('limit') || '100'
    const status = searchParams.get('status')
    const method = searchParams.get('method')

    console.log(`📊 Admin ${adminUser.email} fetching all payments`)

    // Build query
    let query = supabaseAdmin
      .from("payments")
      .select(`
        id,
        amount,
        currency,
        payment_method,
        payment_status,
        payment_type,
        paystack_reference,
        created_at,
        confirmed_at,
        confirmed_by,
        error_message,
        admin_notes,
        deleted_at,
        service_requests (
          id,
          title,
          status,
          clients (
            name,
            email
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit))

    // Filter out soft-deleted payments unless specifically requested
    if (!searchParams.get('include_deleted')) {
      query = query.neq('payment_status', 'deleted')
    }

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('payment_status', status)
    }

    if (method && method !== 'all') {
      query = query.eq('payment_method', method)
    }

    const { data: payments, error } = await query

    if (error) {
      console.error("❌ Error fetching payments:", error)
      return NextResponse.json({
        error: "Failed to fetch payments",
        details: error.message
      }, { status: 500 })
    }

    // Calculate some stats
    const stats = {
      total: payments?.length || 0,
      confirmed: payments?.filter(p => p.payment_status === 'confirmed').length || 0,
      pending: payments?.filter(p => ['pending', 'processing'].includes(p.payment_status)).length || 0,
      failed: payments?.filter(p => ['failed', 'declined'].includes(p.payment_status)).length || 0,
      success: payments?.filter(p => ['success', 'completed'].includes(p.payment_status)).length || 0,
      totalRevenue: payments
        ?.filter(p => p.payment_status === 'confirmed')
        .reduce((sum, p) => sum + (p.amount || 0), 0) || 0
    }

    console.log(`✅ Fetched ${payments?.length || 0} payments for admin dashboard`)

    return NextResponse.json({
      success: true,
      payments: payments || [],
      stats,
      metadata: {
        fetched_at: new Date().toISOString(),
        admin_user: adminUser.email,
        filters_applied: {
          status: status || 'all',
          method: method || 'all',
          limit: parseInt(limit)
        }
      }
    })

  } catch (error: any) {
    console.error("💥 Error in payments fetch:", error)
    return NextResponse.json({
      error: "Failed to fetch payments",
      details: error.message
    }, { status: 500 })
  }
}