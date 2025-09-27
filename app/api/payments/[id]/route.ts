// app/api/payments/[id]/route.ts - Get payment information for success/failure pages
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

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

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const paymentId = params.id

    if (!paymentId) {
      return NextResponse.json({ error: "Payment ID is required" }, { status: 400 })
    }

    // Get payment with related service request and client info
    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .select(`
        id,
        amount,
        currency,
        payment_method,
        payment_type,
        payment_status,
        error_message,
        admin_notes,
        created_at,
        updated_at,
        confirmed_at,
        paystack_reference,
        service_requests (
          id,
          title,
          description,
          service_category,
          estimated_cost,
          status,
          clients (
            id,
            name,
            email,
            company
          )
        )
      `)
      .eq("id", paymentId)
      .single()

    if (error || !payment) {
      console.error("Payment not found:", paymentId, error)
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Return payment information
    return NextResponse.json({
      ...payment,
      // Add some computed fields for convenience
      is_confirmed: ['confirmed', 'paid', 'completed'].includes(payment.payment_status),
      is_failed: ['failed', 'declined', 'cancelled', 'expired'].includes(payment.payment_status),
      is_pending: ['pending', 'processing'].includes(payment.payment_status),
      formatted_amount: `$${payment.amount.toFixed(2)} ${payment.currency.toUpperCase()}`,
      payment_method_display: getPaymentMethodDisplay(payment.payment_method),
      payment_type_display: payment.payment_type === 'split' ? '50% Upfront Payment' : 'Full Payment',
      created_date: new Date(payment.created_at).toLocaleDateString(),
      created_time: new Date(payment.created_at).toLocaleTimeString(),
      confirmed_date: payment.confirmed_at ? new Date(payment.confirmed_at).toLocaleDateString() : null,
      confirmed_time: payment.confirmed_at ? new Date(payment.confirmed_at).toLocaleTimeString() : null
    })

  } catch (error: any) {
    console.error("Error fetching payment information:", error)
    return NextResponse.json({
      error: "Failed to fetch payment information",
      details: error.message
    }, { status: 500 })
  }
}

// Helper function to format payment method for display
function getPaymentMethodDisplay(method: string): string {
  switch (method) {
    case 'paystack':
      return 'Paystack'
    case 'bank_transfer':
      return 'Bank Transfer'
    default:
      return method.replace('_', ' ').split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
  }
}