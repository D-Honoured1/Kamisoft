// app/api/exchange-rate/route.ts - Centralized exchange rate API
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"

interface ExchangeRateCache {
  rate: number
  timestamp: number
  source: string
}

// Simple in-memory cache (in production, use Redis or similar)
let exchangeRateCache: ExchangeRateCache | null = null
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

export async function GET() {
  try {
    // Check cache first
    if (exchangeRateCache && (Date.now() - exchangeRateCache.timestamp) < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        usdToNgn: exchangeRateCache.rate,
        source: exchangeRateCache.source,
        cached: true,
        lastUpdated: new Date(exchangeRateCache.timestamp).toISOString()
      })
    }

    // Get fallback rate from environment
    const fallbackRate = parseFloat(process.env.EXCHANGE_RATE_FALLBACK_USD_TO_NGN || '1550')
    let exchangeRate = fallbackRate
    let source = 'environment-fallback'

    try {
      // Use the same API configuration as payment routes
      const apiKey = process.env.EXCHANGE_RATE_API_KEY
      const apiUrl = apiKey
        ? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`
        : 'https://api.exchangerate-api.com/v4/latest/USD'

      console.log(`🌐 Fetching live exchange rate from: ${apiKey ? 'authenticated API' : 'free API'}`)

      const response = await fetch(apiUrl, {
        signal: AbortSignal.timeout(5000)
      })

      console.log(`📡 Exchange rate API response status: ${response.status}`)

      if (response.ok) {
        const data = await response.json()
        console.log(`📊 Exchange rate API data:`, {
          hasConversionRates: !!data.conversion_rates,
          hasRates: !!data.rates,
          ngnFromConversion: data.conversion_rates?.NGN,
          ngnFromRates: data.rates?.NGN
        })

        const ngnRate = data.conversion_rates?.NGN || data.rates?.NGN
        if (ngnRate && ngnRate > 0) {
          exchangeRate = ngnRate
          source = apiKey ? 'exchangerate-api-authenticated' : 'exchangerate-api-free'
          console.log(`✅ Exchange rate updated: 1 USD = ${exchangeRate} NGN (${source})`)
        } else {
          console.error(`❌ No valid NGN rate found in API response`)
        }
      } else {
        console.error(`❌ Exchange rate API failed with status: ${response.status}`)
        const errorText = await response.text()
        console.error(`❌ Error response:`, errorText)
      }
    } catch (apiError: any) {
      console.error(`❌ Exchange rate API error:`, apiError.message)
      console.warn(`⚠️ Using fallback rate: ${fallbackRate}`)
    }

    // Update cache
    exchangeRateCache = {
      rate: exchangeRate,
      timestamp: Date.now(),
      source
    }

    return NextResponse.json({
      success: true,
      usdToNgn: exchangeRate,
      source,
      cached: false,
      lastUpdated: new Date().toISOString()
    })

  } catch (error: any) {
    console.error("Exchange rate API error:", error)

    // Return fallback rate even in error case
    const fallbackRate = parseFloat(process.env.EXCHANGE_RATE_FALLBACK_USD_TO_NGN || '1550')
    return NextResponse.json({
      success: true,
      usdToNgn: fallbackRate,
      source: 'error-fallback',
      cached: false,
      error: error.message,
      lastUpdated: new Date().toISOString()
    })
  }
}

// Optional: Clear cache endpoint for admin use
export async function DELETE() {
  exchangeRateCache = null
  return NextResponse.json({
    success: true,
    message: "Exchange rate cache cleared"
  })
}