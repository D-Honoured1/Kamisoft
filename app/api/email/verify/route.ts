export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { emailService } from "@/lib/email"

export async function GET() {
  try {
    const verificationResult = await emailService.verifyConnection()

    if (verificationResult.success) {
      return NextResponse.json({
        success: true,
        message: "Email service connection verified successfully",
        config: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          user: process.env.SMTP_USER,
          from: process.env.FROM_EMAIL
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        message: "Email service connection failed",
        error: verificationResult.error
      }, { status: 500 })
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "Email verification failed",
      error: error.message || "Unknown error"
    }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { to, subject, message } = await req.json()

    if (!to || !subject || !message) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: to, subject, message"
      }, { status: 400 })
    }

    const emailResult = await emailService.sendEmail({
      to,
      subject,
      text: message,
      html: `<p>${message.replace(/\n/g, '<br>')}</p>`
    })

    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: "Test email sent successfully",
        messageId: emailResult.messageId
      })
    } else {
      return NextResponse.json({
        success: false,
        message: "Failed to send test email",
        error: emailResult.error
      }, { status: 500 })
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "Test email failed",
      error: error.message || "Unknown error"
    }, { status: 500 })
  }
}