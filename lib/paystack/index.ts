// lib/paystack/index.ts - Paystack utility functions
import { Paystack } from 'paystack-node'

// Initialize Paystack instance
const paystack = new Paystack(process.env.PAYSTACK_SECRET_KEY || '')

export interface PaystackTransactionData {
  email: string
  amount: number // in cents/kobo
  currency?: 'NGN' | 'USD' | 'GHS' | 'ZAR'
  reference?: string
  callback_url?: string
  metadata?: Record<string, any>
  channels?: string[]
}

export interface PaystackVerificationResponse {
  status: boolean
  message: string
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
    fees_breakdown: any
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
    }
    customer: {
      id: number
      first_name: string | null
      last_name: string | null
      email: string
      customer_code: string
      phone: string | null
      metadata: Record<string, any>
      risk_action: string
    }
  }
}

export class PaystackService {
  private paystackInstance: Paystack

  constructor() {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      throw new Error('PAYSTACK_SECRET_KEY environment variable is required')
    }
    this.paystackInstance = new Paystack(process.env.PAYSTACK_SECRET_KEY)
  }

  /**
   * Initialize a transaction
   */
  async initializeTransaction(data: PaystackTransactionData) {
    try {
      const response = await this.paystackInstance.transaction.initialize({
        email: data.email,
        amount: Math.round(data.amount * 100), // Convert to kobo/cents
        currency: data.currency || 'USD',
        reference: data.reference,
        callback_url: data.callback_url,
        metadata: data.metadata,
        channels: data.channels || ['card', 'bank', 'ussd', 'mobile_money', 'bank_transfer']
      })

      return {
        success: response.status,
        message: response.message,
        data: response.data,
        authorization_url: response.data?.authorization_url,
        access_code: response.data?.access_code,
        reference: response.data?.reference
      }
    } catch (error: any) {
      console.error('Paystack initialization error:', error)
      throw new Error(`Failed to initialize payment: ${error.message}`)
    }
  }

  /**
   * Verify a transaction
   */
  async verifyTransaction(reference: string): Promise<PaystackVerificationResponse> {
    try {
      const response = await this.paystackInstance.transaction.verify(reference)
      return response as PaystackVerificationResponse
    } catch (error: any) {
      console.error('Paystack verification error:', error)
      throw new Error(`Failed to verify payment: ${error.message}`)
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(transactionId: string | number) {
    try {
      const response = await this.paystackInstance.transaction.get(transactionId)
      return {
        success: response.status,
        message: response.message,
        data: response.data
      }
    } catch (error: any) {
      console.error('Paystack get transaction error:', error)
      throw new Error(`Failed to get transaction: ${error.message}`)
    }
  }

  /**
   * List transactions with filters
   */
  async listTransactions(options?: {
    perPage?: number
    page?: number
    customer?: string
    status?: 'failed' | 'success' | 'abandoned'
    from?: string
    to?: string
    amount?: number
  }) {
    try {
      const response = await this.paystackInstance.transaction.list(options)
      return {
        success: response.status,
        message: response.message,
        data: response.data,
        meta: response.meta
      }
    } catch (error: any) {
      console.error('Paystack list transactions error:', error)
      throw new Error(`Failed to list transactions: ${error.message}`)
    }
  }

  /**
   * Create a customer
   */
  async createCustomer(data: {
    email: string
    first_name?: string
    last_name?: string
    phone?: string
    metadata?: Record<string, any>
  }) {
    try {
      const response = await this.paystackInstance.customer.create(data)
      return {
        success: response.status,
        message: response.message,
        data: response.data
      }
    } catch (error: any) {
      console.error('Paystack create customer error:', error)
      throw new Error(`Failed to create customer: ${error.message}`)
    }
  }

  /**
   * Get customer details
   */
  async getCustomer(emailOrCustomerCode: string) {
    try {
      const response = await this.paystackInstance.customer.get(emailOrCustomerCode)
      return {
        success: response.status,
        message: response.message,
        data: response.data
      }
    } catch (error: any) {
      console.error('Paystack get customer error:', error)
      throw new Error(`Failed to get customer: ${error.message}`)
    }
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(payload: string, signature: string): boolean {
    try {
      if (!process.env.PAYSTACK_WEBHOOK_SECRET) {
        console.warn('PAYSTACK_WEBHOOK_SECRET not set, skipping signature validation')
        return true // Allow webhook if secret not configured
      }

      const crypto = require('crypto')
      const hash = crypto
        .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET)
        .update(payload)
        .digest('hex')

      return hash === signature
    } catch (error) {
      console.error('Webhook signature validation error:', error)
      return false
    }
  }

  /**
   * Generate payment reference
   */
  generateReference(prefix: string = 'KE'): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `${prefix}_${timestamp}_${random}`
  }

  /**
   * Convert amount from USD to NGN (if needed)
   */
  async convertCurrency(amountUSD: number, targetCurrency: string = 'NGN'): Promise<number> {
    try {
      if (targetCurrency === 'USD') {
        return amountUSD
      }

      // You can integrate with a currency API like exchangerate-api.com or fixer.io
      // For now, using a fixed rate (you should replace this with real-time rates)
      const exchangeRates: Record<string, number> = {
        NGN: 1550, // 1 USD = 1550 NGN (approximate)
        GHS: 12,   // 1 USD = 12 GHS (approximate)
        ZAR: 18    // 1 USD = 18 ZAR (approximate)
      }

      const rate = exchangeRates[targetCurrency] || 1
      return Math.round(amountUSD * rate * 100) / 100 // Round to 2 decimal places
    } catch (error) {
      console.error('Currency conversion error:', error)
      return amountUSD // Fallback to USD amount
    }
  }
}

// Export singleton instance
export const paystackService = new PaystackService()

// Export utility functions
export const paystack_utils = {
  formatAmount: (amount: number, currency: string = 'USD'): string => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      currencyDisplay: currency === 'NGN' ? 'symbol' : 'code'
    })
    return formatter.format(amount)
  },

  formatNairaAmount: (amount: number): string => {
    return `₦${amount.toLocaleString('en-NG')}`
  },

  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  isValidReference: (reference: string): boolean => {
    return reference.length >= 3 && reference.length <= 100
  }
}