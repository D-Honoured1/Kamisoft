// app/api/payment-link/send/route.ts - Send payment link via email
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { emailService } from "@/lib/email"
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      requestId,
      clientName,
      clientEmail,
      paymentLink,
      projectCost,
      splitAmount,
      fullPaymentAmount,
      discountPercent,
      discountAmount,
      linkExpiry,
      serviceTitle
    } = body

    // Validate required fields
    if (!clientName || !clientEmail || !paymentLink || !projectCost || !linkExpiry) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Send payment link email
    const emailResult = await emailService.sendPaymentLinkEmail({
      clientName,
      clientEmail,
      paymentLink,
      projectCost,
      splitAmount: splitAmount || projectCost * 0.5,
      fullPaymentAmount: fullPaymentAmount || projectCost,
      discountPercent: discountPercent || 0,
      discountAmount: discountAmount || 0,
      linkExpiry,
      serviceTitle
    })

    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error || "Failed to send email" },
        { status: 500 }
      )
    }

    // Log the email sending in database (optional)
    if (requestId) {
      try {
        await supabaseAdmin
          .from('service_requests')
          .update({
            payment_link_sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', requestId)
      } catch (dbError) {
        // Don't fail if logging fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment link sent successfully",
      messageId: emailResult.messageId
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
