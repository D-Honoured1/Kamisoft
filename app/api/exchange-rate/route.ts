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

    let exchangeRate = 0
    let source = 'no-rate-available'

    try {
      // Use free exchange rate API first
      const freeApiUrl = 'https://api.exchangerate-api.com/v4/latest/USD'

      console.log(`🌐 Fetching live exchange rate from: free API`)

      const response = await fetch(freeApiUrl, {
        signal: AbortSignal.timeout(5000)
      })

      console.log(`📡 Exchange rate API response status: ${response.status}`)

      if (response.ok) {
        const data = await response.json()
        console.log(`📊 Exchange rate API data:`, {
          hasRates: !!data.rates,
          ngnFromRates: data.rates?.NGN
        })

        const ngnRate = data.rates?.NGN
        if (ngnRate && ngnRate > 0) {
          exchangeRate = ngnRate
          source = 'exchangerate-api-free'
          console.log(`✅ Exchange rate updated: 1 USD = ${exchangeRate} NGN (${source})`)
        } else {
          console.error(`❌ No valid NGN rate found in API response`)
          throw new Error('No NGN rate in response')
        }
      } else {
        console.error(`❌ Exchange rate API failed with status: ${response.status}`)
        const errorText = await response.text()
        console.error(`❌ Error response:`, errorText)
        throw new Error(`API returned ${response.status}`)
      }
    } catch (apiError: any) {
      console.error(`❌ Exchange rate API error:`, apiError.message)

      // Try alternative free API
      try {
        console.log(`🔄 Trying alternative free API...`)
        const altResponse = await fetch('https://api.fxratesapi.com/latest?base=USD&symbols=NGN', {
          signal: AbortSignal.timeout(5000)
        })

        if (altResponse.ok) {
          const altData = await altResponse.json()
          const ngnRate = altData.rates?.NGN
          if (ngnRate && ngnRate > 0) {
            exchangeRate = ngnRate
            source = 'fxratesapi-free'
            console.log(`✅ Exchange rate updated from alternative API: 1 USD = ${exchangeRate} NGN`)
          } else {
            throw new Error('No NGN rate in alternative API')
          }
        } else {
          throw new Error(`Alternative API returned ${altResponse.status}`)
        }
      } catch (altError: any) {
        console.error(`❌ Alternative exchange rate API also failed:`, altError.message)
        throw new Error('All exchange rate APIs unavailable')
      }
    }

    // Only cache valid exchange rates
    if (exchangeRate > 0) {
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
    } else {
      throw new Error('No valid exchange rate available')
    }

  } catch (error: any) {
    console.error("Exchange rate API error:", error)

    return NextResponse.json({
      success: false,
      error: 'Exchange rate service temporarily unavailable',
      details: error.message,
      usdToNgn: null,
      source: 'error',
      cached: false,
      lastUpdated: new Date().toISOString()
    }, { status: 503 })
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