// lib/paystack/index.ts - Paystack utility functions
import { Paystack } from 'paystack-node'

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

interface CircuitBreakerState {
  failures: number
  lastFailureTime: number
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
}

export class PaystackService {
  private paystackInstance: Paystack | null = null
  private circuitBreaker: CircuitBreakerState = {
    failures: 0,
    lastFailureTime: 0,
    state: 'CLOSED'
  }
  private readonly FAILURE_THRESHOLD = 5
  private readonly RECOVERY_TIMEOUT = 30000 // 30 seconds

  constructor() {
    // Don't initialize during build time
  }

  private getPaystackInstance(): Paystack {
    if (!this.paystackInstance) {
      const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim()
      if (!secretKey) {
        throw new Error('PAYSTACK_SECRET_KEY environment variable is required')
      }
      this.paystackInstance = new Paystack(secretKey)
    }
    return this.paystackInstance
  }

  private checkCircuitBreaker(): void {
    const now = Date.now()

    if (this.circuitBreaker.state === 'OPEN') {
      if (now - this.circuitBreaker.lastFailureTime > this.RECOVERY_TIMEOUT) {
        this.circuitBreaker.state = 'HALF_OPEN'
      } else {
        throw new Error('Payment service temporarily unavailable. Please try again later.')
      }
    }
  }

  private recordSuccess(): void {
    this.circuitBreaker.failures = 0
    this.circuitBreaker.state = 'CLOSED'
  }

  private recordFailure(): void {
    this.circuitBreaker.failures += 1
    this.circuitBreaker.lastFailureTime = Date.now()

    if (this.circuitBreaker.failures >= this.FAILURE_THRESHOLD) {
      this.circuitBreaker.state = 'OPEN'
    }
  }

  /**
   * Initialize a transaction with retry logic and circuit breaker
   */
  async initializeTransaction(data: PaystackTransactionData, retries: number = 3) {
    this.checkCircuitBreaker()

    const maxRetries = retries
    let lastError: any

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.getPaystackInstance().transaction.initialize({
          email: data.email,
          amount: Math.round(data.amount * 100), // Convert to kobo/cents
          currency: data.currency || 'USD',
          reference: data.reference,
          callback_url: data.callback_url,
          metadata: {
            ...data.metadata,
            idempotency_key: data.reference // Use reference as idempotency key
          },
          channels: data.channels || ['card', 'bank', 'ussd', 'mobile_money', 'bank_transfer']
        })

        this.recordSuccess()
        return {
          success: response.status,
          message: response.message,
          data: response.data,
          authorization_url: response.data?.authorization_url,
          access_code: response.data?.access_code,
          reference: response.data?.reference
        }
      } catch (error: any) {
        lastError = error
        console.error(`Paystack initialization attempt ${attempt}/${maxRetries} failed:`, {
          error: error.message,
          reference: data.reference,
          email: data.email,
          amount: data.amount
        })

        if (attempt === maxRetries) {
          this.recordFailure()
          break
        }

        // Exponential backoff: wait 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    // Enhanced error handling based on common Paystack errors
    const errorMessage = this.getPaystackErrorMessage(lastError)
    throw new Error(`Failed to initialize payment after ${maxRetries} attempts: ${errorMessage}`)
  }

  /**
   * Verify a transaction with retry logic
   */
  async verifyTransaction(reference: string, retries: number = 3): Promise<PaystackVerificationResponse> {
    const maxRetries = retries
    let lastError: any

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.getPaystackInstance().transaction.verify(reference)
        return response as PaystackVerificationResponse
      } catch (error: any) {
        lastError = error
        console.error(`Paystack verification attempt ${attempt}/${maxRetries} failed:`, error)

        if (attempt === maxRetries) {
          break
        }

        // Shorter delay for verification retries
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      }
    }

    const errorMessage = this.getPaystackErrorMessage(lastError)
    throw new Error(`Failed to verify payment after ${maxRetries} attempts: ${errorMessage}`)
  }

  /**
   * Get transaction details
   */
  async getTransaction(transactionId: string | number) {
    try {
      const response = await this.getPaystackInstance().transaction.get(transactionId)
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
   * List transactions with filters and caching
   */
  private static transactionCache: { [key: string]: { data: any, timestamp: number } } = {}
  private static readonly TRANSACTION_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  async listTransactions(options?: {
    perPage?: number
    page?: number
    customer?: string
    status?: 'failed' | 'success' | 'abandoned'
    from?: string
    to?: string
    amount?: number
  }) {
    const cacheKey = JSON.stringify(options || {})
    const cached = PaystackService.transactionCache[cacheKey]

    // Use cached data if available and not expired
    if (cached && (Date.now() - cached.timestamp) < PaystackService.TRANSACTION_CACHE_DURATION) {
      return cached.data
    }

    try {
      const response = await this.getPaystackInstance().transaction.list(options)
      const result = {
        success: response.status,
        message: response.message,
        data: response.data,
        meta: response.meta
      }

      // Cache the result
      PaystackService.transactionCache[cacheKey] = {
        data: result,
        timestamp: Date.now()
      }

      return result
    } catch (error: any) {
      console.error('Paystack list transactions error:', error)
      throw new Error(`Failed to list transactions: ${error.message}`)
    }
  }

  /**
   * Create a customer with deduplication
   */
  async createCustomer(data: {
    email: string
    first_name?: string
    last_name?: string
    phone?: string
    metadata?: Record<string, any>
  }, retries: number = 2) {
    let lastError: any

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // First, try to get existing customer
        try {
          const existingCustomer = await this.getCustomer(data.email)
          if (existingCustomer.success) {
            return existingCustomer
          }
        } catch {
          // Customer doesn't exist, continue with creation
        }

        const response = await this.getPaystackInstance().customer.create(data)
        return {
          success: response.status,
          message: response.message,
          data: response.data
        }
      } catch (error: any) {
        lastError = error
        console.error(`Paystack create customer attempt ${attempt}/${retries} failed:`, error)

        if (attempt === retries) {
          break
        }

        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      }
    }

    const errorMessage = this.getPaystackErrorMessage(lastError)
    throw new Error(`Failed to create customer after ${retries} attempts: ${errorMessage}`)
  }

  /**
   * Get customer details with retry
   */
  async getCustomer(emailOrCustomerCode: string, retries: number = 2) {
    let lastError: any

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.getPaystackInstance().customer.get(emailOrCustomerCode)
        return {
          success: response.status,
          message: response.message,
          data: response.data
        }
      } catch (error: any) {
        lastError = error
        console.error(`Paystack get customer attempt ${attempt}/${retries} failed:`, error)

        if (attempt === retries) {
          break
        }

        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      }
    }

    const errorMessage = this.getPaystackErrorMessage(lastError)
    throw new Error(`Failed to get customer after ${retries} attempts: ${errorMessage}`)
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(payload: string, signature: string): boolean {
    try {
      const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET?.trim()
      if (!webhookSecret) {
        console.warn('PAYSTACK_WEBHOOK_SECRET not set, skipping signature validation')
        return true // Allow webhook if secret not configured
      }

      const crypto = require('crypto')
      const hash = crypto
        .createHmac('sha512', webhookSecret)
        .update(payload)
        .digest('hex')

      return hash === signature
    } catch (error) {
      console.error('Webhook signature validation error:', error)
      return false
    }
  }

  /**
   * Generate payment reference with collision avoidance
   */
  private static usedReferences: Set<string> = new Set()
  private static readonly MAX_REFERENCE_ATTEMPTS = 10

  generateReference(prefix: string = 'KE'): string {
    for (let attempt = 0; attempt < PaystackService.MAX_REFERENCE_ATTEMPTS; attempt++) {
      const timestamp = Date.now() + attempt // Add attempt to ensure uniqueness
      const random = Math.random().toString(36).substring(2, 8).toUpperCase()
      const reference = `${prefix}_${timestamp}_${random}`

      if (!PaystackService.usedReferences.has(reference)) {
        PaystackService.usedReferences.add(reference)

        // Clean up old references to prevent memory leaks (keep last 1000)
        if (PaystackService.usedReferences.size > 1000) {
          const referencesArray = Array.from(PaystackService.usedReferences)
          PaystackService.usedReferences = new Set(referencesArray.slice(-500))
        }

        return reference
      }
    }

    // Fallback - should be extremely rare
    return `${prefix}_${Date.now()}_${crypto.randomUUID().slice(0, 8).toUpperCase()}`
  }

  /**
   * Get enhanced error message for Paystack errors
   */
  private getPaystackErrorMessage(error: any): string {
    if (!error) return 'Unknown error occurred'

    const message = error.message || error.toString()

    // Common Paystack error patterns
    if (message.includes('Invalid key')) {
      return 'Invalid API key. Please check your Paystack configuration.'
    }
    if (message.includes('Invalid email')) {
      return 'Invalid email address provided.'
    }
    if (message.includes('Invalid amount')) {
      return 'Invalid payment amount. Amount must be greater than 0.'
    }
    if (message.includes('Network Error') || message.includes('ECONNREFUSED')) {
      return 'Network connection error. Please check your internet connection and try again.'
    }
    if (message.includes('timeout')) {
      return 'Request timeout. Please try again.'
    }
    if (message.includes('rate limit')) {
      return 'Too many requests. Please wait a moment and try again.'
    }

    return message
  }

  /**
   * Convert amount from USD to NGN (if needed) with caching
   */
  private static exchangeRateCache: { [key: string]: { rate: number, timestamp: number } } = {}
  private static readonly CACHE_DURATION = 60 * 60 * 1000 // 1 hour

  async convertCurrency(amountUSD: number, targetCurrency: string = 'NGN'): Promise<number> {
    try {
      if (targetCurrency === 'USD') {
        return amountUSD
      }

      const cacheKey = `USD_${targetCurrency}`
      const cached = PaystackService.exchangeRateCache[cacheKey]

      // Use cached rate if available and not expired
      if (cached && (Date.now() - cached.timestamp) < PaystackService.CACHE_DURATION) {
        return Math.round(amountUSD * cached.rate * 100) / 100
      }

      // Fallback rates (you should replace this with real-time rates)
      const exchangeRates: Record<string, number> = {
        NGN: 1550, // 1 USD = 1550 NGN (approximate)
        GHS: 12,   // 1 USD = 12 GHS (approximate)
        ZAR: 18    // 1 USD = 18 ZAR (approximate)
      }

      const rate = exchangeRates[targetCurrency] || 1

      // Cache the rate
      PaystackService.exchangeRateCache[cacheKey] = {
        rate,
        timestamp: Date.now()
      }

      return Math.round(amountUSD * rate * 100) / 100 // Round to 2 decimal places
    } catch (error) {
      console.error('Currency conversion error:', error)
      return amountUSD // Fallback to USD amount
    }
  }

  /**
   * Cleanup cache for long-running processes
   */
  cleanupCache(): void {
    const now = Date.now()

    // Clean transaction cache
    Object.keys(PaystackService.transactionCache).forEach(key => {
      if (now - PaystackService.transactionCache[key].timestamp > PaystackService.TRANSACTION_CACHE_DURATION) {
        delete PaystackService.transactionCache[key]
      }
    })

    // Clean exchange rate cache
    Object.keys(PaystackService.exchangeRateCache).forEach(key => {
      if (now - PaystackService.exchangeRateCache[key].timestamp > PaystackService.CACHE_DURATION) {
        delete PaystackService.exchangeRateCache[key]
      }
    })

    console.log('Paystack cache cleanup completed')
  }
}

// Add crypto import for fallback reference generation
const crypto = require('crypto')

// Export singleton instance
export const paystackService = new PaystackService()

// Cleanup function for long-running processes
export const cleanupPaystackCache = () => {
  paystackService.cleanupCache()
}

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