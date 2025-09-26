// components/crypto/crypto-payment-selector.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Zap, DollarSign, Shield, ArrowRight } from "lucide-react"
import Image from "next/image"

interface CryptoCurrency {
  id: string
  name: string
  symbol: string
  network: string
  minAmount: number
  maxAmount: number
  isStablecoin: boolean
  isPopular: boolean
  smartContract?: string
}

interface CryptoPaymentSelectorProps {
  usdAmount: number
  onCurrencySelect: (currency: string) => void
  disabled?: boolean
}

const currencyColors: Record<string, string> = {
  'btc': 'bg-orange-100 text-orange-800 border-orange-200',
  'eth': 'bg-gray-100 text-gray-800 border-gray-200',
  'usdt': 'bg-green-100 text-green-800 border-green-200',
  'usdc': 'bg-blue-100 text-blue-800 border-blue-200',
  'ltc': 'bg-gray-100 text-gray-800 border-gray-200',
  'doge': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'bnb': 'bg-yellow-100 text-yellow-800 border-yellow-200'
}

const getCurrencyColor = (symbol: string): string => {
  const key = symbol.toLowerCase()
  return currencyColors[key] || 'bg-gray-100 text-gray-800 border-gray-200'
}

export function CryptoPaymentSelector({
  usdAmount,
  onCurrencySelect,
  disabled = false
}: CryptoPaymentSelectorProps) {
  const [currencies, setCurrencies] = useState<CryptoCurrency[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null)

  useEffect(() => {
    fetchCurrencies()
  }, [])

  const fetchCurrencies = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/crypto/generate')

      if (!response.ok) {
        throw new Error('Failed to fetch supported cryptocurrencies')
      }

      const data = await response.json()

      // Filter currencies based on amount limits and show popular ones first
      const availableCurrencies = data.currencies.filter((currency: CryptoCurrency) =>
        usdAmount >= currency.minAmount && usdAmount <= currency.maxAmount
      )

      setCurrencies(availableCurrencies)
    } catch (err: any) {
      console.error('Error fetching cryptocurrencies:', err)
      setError(err.message || 'Failed to load crypto payment options')
    } finally {
      setLoading(false)
    }
  }

  const handleCurrencySelect = (currencyId: string) => {
    if (disabled) return
    setSelectedCurrency(currencyId)
    onCurrencySelect(currencyId)
  }

  const getRecommendation = (currency: CryptoCurrency): string | null => {
    if (currency.isPopular) {
      return 'Popular choice'
    }
    if (currency.isStablecoin) {
      return 'Stable value'
    }
    if (currency.symbol.toLowerCase() === 'btc') {
      return 'Most trusted'
    }
    return null
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading cryptocurrency options...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error}
          <Button
            variant="outline"
            size="sm"
            className="ml-2"
            onClick={fetchCurrencies}
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (currencies.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          No cryptocurrency payment options available for ${usdAmount.toFixed(2)}.
          Please try a different amount or contact support.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Choose Cryptocurrency</h3>
        <p className="text-muted-foreground text-sm">
          Select your preferred cryptocurrency to pay ${usdAmount.toFixed(2)}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currencies.map((currency) => {
          const isSelected = selectedCurrency === currency.id
          const recommendation = getRecommendation(currency)

          return (
            <Card
              key={currency.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected
                  ? 'ring-2 ring-primary shadow-md'
                  : 'hover:border-primary/50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => handleCurrencySelect(currency.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* <Image
                      src={networkIcons[network.id] || '/crypto/default.svg'}
                      alt={network.symbol}
                      width={32}
                      height={32}
                      className="rounded-full"
                    /> */}
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">
                        {currency.symbol.substring(0, 2)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{currency.name}</h4>
                      <p className="text-xs text-muted-foreground">{currency.network}</p>
                    </div>
                  </div>

                  {recommendation && (
                    <Badge variant="secondary" className="text-xs">
                      {recommendation}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      <span>Min amount:</span>
                    </div>
                    <span className="font-medium">${currency.minAmount}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      <span>Type:</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getCurrencyColor(currency.symbol)}`}
                    >
                      {currency.isStablecoin ? 'Stablecoin' : 'Cryptocurrency'}
                    </Badge>
                  </div>

                  {currency.isPopular && (
                    <div className="flex items-center gap-1 text-xs text-blue-600">
                      <Zap className="h-3 w-3" />
                      <span>Popular choice</span>
                    </div>
                  )}
                </div>

                {currency.isStablecoin && (
                  <div className="mt-3 p-2 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-1 text-xs text-green-700">
                      <Shield className="h-3 w-3" />
                      <span className="font-medium">Price stable - pegged to USD</span>
                    </div>
                  </div>
                )}

                {isSelected && (
                  <div className="mt-3 flex items-center justify-center">
                    <Button size="sm" className="w-full">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Continue with {currency.symbol}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-medium text-sm mb-2">Payment Process:</h4>
        <ol className="text-xs text-muted-foreground space-y-1">
          <li>1. Select your preferred cryptocurrency above</li>
          <li>2. Send the exact amount to the provided address</li>
          <li>3. Payment is automatically detected by NOWPayments</li>
          <li>4. Payment confirmed within 5-30 minutes</li>
        </ol>
      </div>
    </div>
  )
}