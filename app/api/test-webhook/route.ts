// app/api/test-webhook/route.ts - Test webhook functionality
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    console.log('🧪 Test webhook received:', {
      headers: Object.fromEntries(req.headers.entries()),
      body: body.substring(0, 500) + (body.length > 500 ? '...' : ''),
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      status: 'success',
      message: 'Test webhook received',
      timestamp: new Date().toISOString(),
      received_data: body.length > 0 ? 'Data received' : 'No data'
    })
  } catch (error: any) {
    console.error('❌ Test webhook error:', error)
    return NextResponse.json({
      status: 'error',
      message: error.message
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    message: 'Test webhook endpoint is ready',
    timestamp: new Date().toISOString()
  })
}