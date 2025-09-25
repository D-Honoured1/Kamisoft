// lib/paystack/index.ts - FIXED VERSION
import crypto from 'crypto'

// Type definitions for Paystack API
interface PaystackTransactionData {
  email: string
  amount: number // Amount in kobo (multiply by 100)
  currency?: string
  reference: string
  callback_url?: string
  metadata?: Record<string, any>
  channels?: string[]
}

interface PaystackResponse {
  status: boolean
  message: string
  data: any
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
    log: any
    fees: number
    fees_split: any
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
    plan: any
    split: any
    order_id: any
    paidAt: string
    createdAt: string
    requested_amount: number
    pos_transaction_data: any
    source: any
    fees_breakdown: any
  }
}

class PaystackService {
  private baseUrl = 'https://api.paystack.co'
  private secretKey: string

  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY || ''
    
    if (!this.secretKey) {
      throw new Error('PAYSTACK_SECRET_KEY environment variable is required')
    }
    
    if (!this.secretKey.startsWith('sk_')) {
      throw new Error('Invalid Paystack secret key format. Should start with sk_')
    }
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' = 'GET', data?: any): Promise<PaystackResponse> {
    const url = `${this.baseUrl}${endpoint}`
    
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    }

    if (data && method === 'POST') {
      requestOptions.body = JSON.stringify(data)
    }

    console.log(`🔄 Paystack API Request: ${method} ${endpoint}`)

    const response = await fetch(url, requestOptions)
    
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
  }

  async initializeTransaction(params: {
    email: string
    amount: number // Amount in the specified currency
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
  }> {
    try {
      console.log('🚀 Initializing Paystack transaction:', {
        email: params.email,
        amount: params.amount,
        currency: params.currency || 'NGN',
        reference: params.reference
      })

      // Convert to kobo/cents for Paystack
      // For NGN: multiply by 100 (kobo)
      // For USD: multiply by 100 (cents) - but NGN is preferred
      const currency = params.currency || 'NGN'
      const amountInKobo = Math.round(params.amount * 100)

      const requestData: PaystackTransactionData = {
        email: params.email,
        amount: amountInKobo,
        currency: currency,
        reference: params.reference,
        callback_url: params.callback_url,
        metadata: {
          ...params.metadata,
          original_amount: params.amount,
          original_currency: currency,
          integration_type: 'kamisoft_payment_system'
        },
        channels: params.channels || ['card', 'bank', 'ussd', 'mobile_money', 'bank_transfer']
      }

      const response = await this.makeRequest('/transaction/initialize', 'POST', requestData) as PaystackInitializeResponse

      if (response.status && response.data) {
        return {
          success: true,
          message: response.message,
          authorization_url: response.data.authorization_url,
          access_code: response.data.access_code,
          reference: response.data.reference
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

  async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    try {
      console.log('🔍 Verifying Paystack transaction:', reference)

      const response = await this.makeRequest(`/transaction/verify/${encodeURIComponent(reference)}`) as PaystackVerifyResponse

      console.log('✅ Transaction verification result:', {
        reference,
        status: response.data?.status,
        amount: response.data?.amount ? (response.data.amount / 100) : null,
        currency: response.data?.currency
      })

      return response
    } catch (error: any) {
      console.error('❌ Paystack verification error:', error)
      throw error
    }
  }

  async listTransactions(params?: {
    perPage?: number
    page?: number
    customer?: string
    status?: string
    from?: string
    to?: string
    amount?: number
  }): Promise<PaystackResponse> {
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
      return await this.makeRequest(endpoint)
    } catch (error: any) {
      console.error('❌ Error listing transactions:', error)
      throw error
    }
  }

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

  // Helper method to convert currency amounts
  convertToKobo(amount: number, currency: 'USD' | 'NGN' = 'USD'): number {
    return Math.round(amount * 100)
  }

  convertFromKobo(amount: number, currency: 'USD' | 'NGN' = 'USD'): number {
    return amount / 100
  }

  // Get current exchange rates (you'd typically call a real API for this)
  async getExchangeRate(from: string = 'USD', to: string = 'NGN'): Promise<number> {
    try {
      // In production, you'd call a real exchange rate API
      // For now, return a reasonable USD to NGN rate
      if (from === 'USD' && to === 'NGN') {
        return 1550 // $1 = ₦1,550 (update this regularly)
      }
      return 1
    } catch (error) {
      console.error('Error fetching exchange rate:', error)
      return 1550 // Fallback rate
    }
  }
}

// Export singleton instance
export const paystackService = new PaystackService()

// Export types for use in other files
export type { 
  PaystackTransactionData, 
  PaystackResponse, 
  PaystackInitializeResponse, 
  PaystackVerifyResponse 
}