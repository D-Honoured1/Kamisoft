// lib/paystack/index.ts
import crypto from 'crypto'

// Type definitions
interface PaystackTransactionData {
  email: string
  amount: number // Amount in kobo
  currency: string
  reference: string
  callback_url?: string
  metadata?: Record<string, any>
  channels?: string[]
}

interface PaystackResponse {
  status: boolean
  message: string
  data?: any
  meta?: any
}

interface PaystackInitializeResponse extends PaystackResponse {
  data: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

interface PaystackVerifyResponse extends PaystackResponse {
  data: {
    id: number
    domain: string
    status: string
    reference: string
    amount: number
    message: string | null
    gateway_response: string
    paid_at: string
    created_at: string
    channel: string
    currency: string
    ip_address: string
    metadata: Record<string, any>
    authorization: {
      authorization_code: string
      bin: string
      last4: string
      exp_month: string
      exp_year: string
      channel: string
      card_type: string
      bank: string
      country_code: string
      brand: string
      reusable: boolean
      signature: string
    }
    customer: {
      id: number
      first_name: string
      last_name: string
      email: string
      customer_code: string
      phone: string
      metadata: Record<string, any>
      risk_action: string
    }
  }
}

interface ExchangeRateResult {
  rate: number
  source: string
  cached: boolean
}

export class PaystackService {
  private secretKey: string
  private baseUrl = 'https://api.paystack.co'
  private exchangeRateCache = new Map<string, { rate: number; timestamp: number; source: string }>()
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes
  private defaultExchangeRate = 1550 // USD to NGN fallback

  constructor(secretKey: string) {
    if (!secretKey) {
      throw new Error('Paystack secret key is required')
    }
    
    if (!secretKey.startsWith('sk_')) {
      throw new Error('Invalid Paystack secret key format. Should start with sk_')
    }
    
    this.secretKey = secretKey
  }

  // Simple fetch with timeout using Promise.race
  private async fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 30000): Promise<Response> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    })

    const fetchPromise = fetch(url, options)
    
    return Promise.race([fetchPromise, timeoutPromise])
  }

  // Core API request method
  private async makeRequest(endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any): Promise<PaystackResponse> {
    const url = `${this.baseUrl}${endpoint}`
    
    console.log(`🔄 Paystack API: ${method} ${endpoint}`)
    
    try {
      const response = await this.fetchWithTimeout(url, {
        method,
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'User-Agent': 'KamisoftPaymentSystem/1.0'
        },
        body: body ? JSON.stringify(body) : undefined
      }, 30000)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Paystack API Error: ${response.status}`, errorText)
        throw new Error(`Paystack API error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      
      console.log(`✅ Paystack API Response: ${result.status ? 'Success' : 'Failed'}`, {
        status: result.status,
        message: result.message
      })

      return result
    } catch (error: any) {
      console.error(`❌ Paystack request failed:`, error)
      throw error
    }
  }

  // Exchange rate methods
  private async fetchExchangeRate(from: string = 'USD', to: string = 'NGN'): Promise<ExchangeRateResult> {
    const cacheKey = `${from}_${to}`
    const cached = this.exchangeRateCache.get(cacheKey)
    
    // Return cached rate if still valid
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return {
        rate: cached.rate,
        source: cached.source,
        cached: true
      }
    }

    // Fetch fresh rate
    try {
      console.log(`🌐 Fetching exchange rate: ${from} → ${to}`)
      
      const response = await this.fetchWithTimeout(`https://api.exchangerate-api.com/v4/latest/${from}`, {
        headers: { 'User-Agent': 'KamisoftPaymentSystem/1.0' }
      }, 5000)

      if (!response.ok) {
        throw new Error(`Exchange rate API returned ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.rates || !data.rates[to]) {
        throw new Error(`Rate for ${to} not found`)
      }

      const rate = data.rates[to]
      
      // Cache the result
      this.exchangeRateCache.set(cacheKey, {
        rate,
        timestamp: Date.now(),
        source: 'ExchangeRate-API'
      })

      console.log(`✅ Got exchange rate: 1 ${from} = ${rate} ${to}`)
      
      return {
        rate,
        source: 'ExchangeRate-API',
        cached: false
      }
    } catch (error: any) {
      console.warn(`⚠️ Exchange rate API failed:`, error.message)
      
      return {
        rate: this.defaultExchangeRate,
        source: 'fallback',
        cached: false
      }
    }
  }

  // Main transaction initialization method
  async initializeTransaction(params: {
    email: string
    amount: number // Amount in the original currency
    currency?: string
    reference: string
    callback_url?: string
    metadata?: Record<string, any>
    channels?: string[]
  }): Promise<{
    success: boolean
    message: string
    authorization_url?: string
    access_code?: string
    reference?: string
    converted_amount?: number
    original_amount?: number
    exchange_rate?: number
    exchange_source?: string
  }> {
    try {
      console.log('🚀 Initializing Paystack transaction:', {
        email: params.email,
        amount: params.amount,
        currency: params.currency || 'USD',
        reference: params.reference
      })

      const originalCurrency = params.currency || 'USD'
      let finalAmount = params.amount
      let exchangeRate = 1
      let exchangeSource = 'none'

      // Handle currency conversion for non-NGN currencies
      if (originalCurrency !== 'NGN') {
        console.log(`💱 Converting ${originalCurrency} to NGN for Paystack`)
        
        const rateResult = await this.fetchExchangeRate(originalCurrency, 'NGN')
        exchangeRate = rateResult.rate
        exchangeSource = rateResult.source
        finalAmount = params.amount * exchangeRate

        console.log(`💰 Conversion: ${params.amount} ${originalCurrency} = ${finalAmount.toFixed(2)} NGN (rate: ${exchangeRate}, source: ${exchangeSource})`)
      }

      // Convert to kobo for Paystack API
      const amountInKobo = Math.round(finalAmount * 100)

      const requestData: PaystackTransactionData = {
        email: params.email,
        amount: amountInKobo,
        currency: 'NGN', // Always use NGN for Paystack
        reference: params.reference,
        callback_url: params.callback_url,
        metadata: {
          // Preserve original transaction details
          original_amount: params.amount,
          original_currency: originalCurrency,
          ngn_amount: finalAmount,
          exchange_rate: exchangeRate,
          exchange_source: exchangeSource,
          conversion_timestamp: new Date().toISOString(),
          
          // Integration metadata
          integration_type: 'kamisoft_payment_system',
          integration_version: '2.0',
          
          // User provided metadata
          ...params.metadata
        },
        channels: params.channels || ['card', 'bank', 'ussd', 'mobile_money', 'bank_transfer', 'qr']
      }

      const response = await this.makeRequest('/transaction/initialize', 'POST', requestData) as PaystackInitializeResponse

      if (response.status && response.data) {
        return {
          success: true,
          message: response.message,
          authorization_url: response.data.authorization_url,
          access_code: response.data.access_code,
          reference: response.data.reference,
          converted_amount: finalAmount,
          original_amount: params.amount,
          exchange_rate: exchangeRate,
          exchange_source: exchangeSource
        }
      } else {
        throw new Error(response.message || 'Failed to initialize transaction')
      }
    } catch (error: any) {
      console.error('❌ Paystack initialization error:', error)
      return {
        success: false,
        message: error.message || 'Transaction initialization failed'
      }
    }
  }

  // Transaction verification
  async verifyTransaction(reference: string): Promise<{
    success: boolean
    data?: PaystackVerifyResponse['data']
    message: string
  }> {
    try {
      console.log('🔍 Verifying transaction:', reference)

      const response = await this.makeRequest(`/transaction/verify/${encodeURIComponent(reference)}`) as PaystackVerifyResponse

      if (response.status && response.data) {
        console.log('✅ Transaction verified:', {
          reference: response.data.reference,
          status: response.data.status,
          amount: response.data.amount / 100,
          currency: response.data.currency
        })

        return {
          success: true,
          data: response.data,
          message: 'Transaction verified successfully'
        }
      } else {
        return {
          success: false,
          message: response.message || 'Transaction verification failed'
        }
      }
    } catch (error: any) {
      console.error('❌ Transaction verification error:', error)
      return {
        success: false,
        message: error.message || 'Verification request failed'
      }
    }
  }

  // List transactions with pagination
  async listTransactions(params?: {
    perPage?: number
    page?: number
    customer?: string
    status?: 'failed' | 'success' | 'abandoned'
    from?: string
    to?: string
    amount?: number
  }): Promise<{
    success: boolean
    data?: any[]
    message: string
    meta?: any
  }> {
    try {
      const queryParams = new URLSearchParams()
      
      if (params?.perPage) queryParams.set('perPage', params.perPage.toString())
      if (params?.page) queryParams.set('page', params.page.toString())
      if (params?.customer) queryParams.set('customer', params.customer)
      if (params?.status) queryParams.set('status', params.status)
      if (params?.from) queryParams.set('from', params.from)
      if (params?.to) queryParams.set('to', params.to)
      if (params?.amount) queryParams.set('amount', (params.amount * 100).toString())

      const endpoint = `/transaction${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      const response = await this.makeRequest(endpoint)

      if (response.status) {
        return {
          success: true,
          data: response.data,
          message: 'Transactions retrieved successfully',
          meta: response.meta
        }
      } else {
        return {
          success: false,
          message: response.message || 'Failed to retrieve transactions'
        }
      }
    } catch (error: any) {
      console.error('❌ Error listing transactions:', error)
      return {
        success: false,
        message: error.message || 'Failed to list transactions'
      }
    }
  }

  // Webhook signature validation
  validateWebhookSignature(payload: string, signature: string): boolean {
    try {
      const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET || this.secretKey
      const hash = crypto.createHmac('sha512', webhookSecret).update(payload).digest('hex')
      
      const isValid = hash === signature
      
      console.log('🔐 Webhook signature validation:', {
        isValid,
        receivedSignature: signature?.substring(0, 10) + '...',
        computedSignature: hash?.substring(0, 10) + '...'
      })
      
      return isValid
    } catch (error) {
      console.error('❌ Webhook signature validation error:', error)
      return false
    }
  }

  // Utility methods
  convertToKobo(amount: number): number {
    return Math.round(amount * 100)
  }

  convertFromKobo(amount: number): number {
    return amount / 100
  }

  getSupportedChannels(): string[] {
    return ['card', 'bank', 'ussd', 'mobile_money', 'bank_transfer', 'qr']
  }

  // Get exchange rate cache statistics
  getExchangeRateCacheStats(): {
    size: number
    entries: Array<{ pair: string; rate: number; age: number; source: string }>
  } {
    const entries = Array.from(this.exchangeRateCache.entries()).map(([key, value]) => ({
      pair: key.replace('_', '/'),
      rate: value.rate,
      age: Math.round((Date.now() - value.timestamp) / 1000),
      source: value.source
    }))

    return {
      size: this.exchangeRateCache.size,
      entries
    }
  }

  // Clear exchange rate cache
  clearExchangeRateCache(): void {
    this.exchangeRateCache.clear()
    console.log('🧹 Exchange rate cache cleared')
  }
}

// Lazy initialization singleton to avoid environment variable issues
let _paystackInstance: PaystackService | null = null

function getPaystackInstance(): PaystackService {
  if (!_paystackInstance) {
    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) {
      throw new Error(
        'PAYSTACK_SECRET_KEY environment variable is not set. ' +
        'Please add PAYSTACK_SECRET_KEY=sk_test_... to your .env.local file'
      )
    }
    _paystackInstance = new PaystackService(secretKey)
  }
  return _paystackInstance
}

// Export a service object with all methods
export const paystackService = {
  async initializeTransaction(params: Parameters<PaystackService['initializeTransaction']>[0]) {
    return getPaystackInstance().initializeTransaction(params)
  },

  async verifyTransaction(reference: string) {
    return getPaystackInstance().verifyTransaction(reference)
  },

  async listTransactions(params?: Parameters<PaystackService['listTransactions']>[0]) {
    return getPaystackInstance().listTransactions(params)
  },

  validateWebhookSignature(payload: string, signature: string) {
    return getPaystackInstance().validateWebhookSignature(payload, signature)
  },

  convertToKobo(amount: number) {
    return getPaystackInstance().convertToKobo(amount)
  },

  convertFromKobo(amount: number) {
    return getPaystackInstance().convertFromKobo(amount)
  },

  getSupportedChannels() {
    return getPaystackInstance().getSupportedChannels()
  },

  getExchangeRateCacheStats() {
    return getPaystackInstance().getExchangeRateCacheStats()
  },

  clearExchangeRateCache() {
    return getPaystackInstance().clearExchangeRateCache()
  }
}

// Also export as default for better compatibility
export default paystackService


// Export types for external use
export type {
  PaystackTransactionData,
  PaystackResponse,
  PaystackInitializeResponse,
  PaystackVerifyResponse
}