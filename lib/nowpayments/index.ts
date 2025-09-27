// lib/nowpayments/index.ts - NOWPayments API integration service
export interface NOWPaymentsConfig {
  apiKey: string
  sandboxMode: boolean
  baseUrl: string
  ipnCallbackUrl?: string
}

export interface NOWPaymentsCurrency {
  currency: string
  name: string
  network?: string
  smart_contract?: string
  min_amount?: number
  max_amount?: number
  is_fiat: boolean
  is_popular: boolean
  is_stable: boolean
}

export interface NOWPaymentsCreatePaymentRequest {
  price_amount: number
  price_currency: string
  pay_currency: string
  ipn_callback_url?: string
  order_id?: string
  order_description?: string
  purchase_id?: string
  payout_address?: string
  payout_currency?: string
  payout_extra_id?: string
  pay_amount?: number
  fixed_rate?: boolean
  is_fee_paid_by_user?: boolean
}

export interface NOWPaymentsCreatePaymentResponse {
  payment_id: string
  payment_status: string
  pay_address: string
  price_amount: number
  price_currency: string
  pay_amount: number
  actually_paid?: number
  pay_currency: string
  order_id?: string
  order_description?: string
  purchase_id?: string
  created_at: string
  updated_at: string
  outcome_amount?: number
  outcome_currency?: string
  payin_extra_id?: string
  payout_extra_id?: string
  time_limit?: string
  burning_percent?: string
  expiration_estimate_date?: string
  is_fixed_rate?: boolean
  is_fee_paid_by_user?: boolean
}

export interface NOWPaymentsPaymentStatus {
  payment_id: string
  payment_status: string
  pay_address: string
  price_amount: number
  price_currency: string
  pay_amount: number
  actually_paid?: number
  pay_currency: string
  order_id?: string
  order_description?: string
  purchase_id?: string
  outcome_amount?: number
  outcome_currency?: string
  created_at: string
  updated_at: string
  payin_extra_id?: string
  payout_extra_id?: string
  smart_contract?: string
  network?: string
  network_precision?: number
  time_limit?: string
  burning_percent?: string
  expiration_estimate_date?: string
  is_fixed_rate?: boolean
  is_fee_paid_by_user?: boolean
}

export interface NOWPaymentsEstimate {
  currency_from: string
  amount_from: number
  currency_to: string
  estimated_amount: number
}

export interface NOWPaymentsPaymentDetails {
  paymentId: string
  payAddress: string
  payAmount: number
  payCurrency: string
  priceAmount: number
  priceCurrency: string
  paymentStatus: string
  network?: string
  smartContract?: string
  qrCodeUrl: string
  explorerUrl?: string
  expiresAt?: string
  timeLimit?: string
  orderDescription?: string
  purchaseId?: string
}

export class NOWPaymentsService {
  private config: NOWPaymentsConfig
  private currenciesCache: { data: NOWPaymentsCurrency[]; timestamp: number } | null = null
  private cacheTimeout = 10 * 60 * 1000 // 10 minutes

  constructor(config: NOWPaymentsConfig) {
    this.config = config
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'x-api-key': this.config.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `NOWPayments API error: ${response.status}`

      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {
        errorMessage += ` - ${errorText}`
      }

      throw new Error(errorMessage)
    }

    return response.json()
  }

  // Get API status
  async getStatus(): Promise<{ message: string }> {
    return this.makeRequest('/v1/status')
  }

  // Get available currencies
  async getCurrencies(): Promise<NOWPaymentsCurrency[]> {
    // Check cache first
    if (this.currenciesCache && (Date.now() - this.currenciesCache.timestamp) < this.cacheTimeout) {
      return this.currenciesCache.data
    }

    const response = await this.makeRequest<{ currencies?: string[] }>('/v1/currencies')
    const currencyStrings = response.currencies || []

    // Convert string array to NOWPaymentsCurrency objects
    const currencies: NOWPaymentsCurrency[] = currencyStrings.map(currencyCode => ({
      currency: currencyCode,
      name: currencyCode.toUpperCase(),
      network: this.getNetworkName(currencyCode),
      min_amount: 0.001,
      max_amount: 1000000,
      is_fiat: false, // All are crypto since we get them from /currencies
      is_popular: this.isPopularCurrency(currencyCode),
      is_stable: this.isStablecoin(currencyCode)
    }))

    // Cache the result
    this.currenciesCache = {
      data: currencies,
      timestamp: Date.now()
    }

    return currencies
  }

  // Get available cryptocurrencies for payments
  async getPaymentCurrencies(): Promise<NOWPaymentsCurrency[]> {
    const currencies = await this.getCurrencies()
    return currencies.filter(currency => !currency.is_fiat)
  }

  // Get estimate for payment
  async getEstimate(
    amount: number,
    currencyFrom: string,
    currencyTo: string
  ): Promise<NOWPaymentsEstimate> {
    const params = new URLSearchParams({
      amount: amount.toString(),
      currency_from: currencyFrom,
      currency_to: currencyTo
    })

    return this.makeRequest(`/v1/estimate?${params}`)
  }

  // Get minimum payment amount for currency
  async getMinimumAmount(
    currencyFrom: string,
    currencyTo: string
  ): Promise<{ currency_from: string; currency_to: string; min_amount: number }> {
    const params = new URLSearchParams({
      currency_from: currencyFrom,
      currency_to: currencyTo
    })

    return this.makeRequest(`/v1/min-amount?${params}`)
  }

  // Create payment
  async createPayment(
    request: NOWPaymentsCreatePaymentRequest
  ): Promise<NOWPaymentsCreatePaymentResponse> {
    // Add default callback URL if not provided
    if (!request.ipn_callback_url && this.config.ipnCallbackUrl) {
      request.ipn_callback_url = this.config.ipnCallbackUrl
    }

    return this.makeRequest('/v1/payment', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  // Get payment status
  async getPaymentStatus(paymentId: string): Promise<NOWPaymentsPaymentStatus> {
    return this.makeRequest(`/v1/payment/${paymentId}`)
  }

  // Get list of payments
  async getPayments(params?: {
    limit?: number
    page?: number
    sortBy?: string
    orderBy?: 'asc' | 'desc'
    dateFrom?: string
    dateTo?: string
  }): Promise<{ data: NOWPaymentsPaymentStatus[] }> {
    const queryParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString())
        }
      })
    }

    const queryString = queryParams.toString()
    const endpoint = queryString ? `/v1/payment/?${queryString}` : '/v1/payment/'

    return this.makeRequest(endpoint)
  }

  // Generate payment details for frontend
  async generatePaymentDetails(
    usdAmount: number,
    payCurrency: string,
    orderId?: string,
    orderDescription?: string
  ): Promise<NOWPaymentsPaymentDetails> {
    // Create payment with NOWPayments
    const paymentRequest: NOWPaymentsCreatePaymentRequest = {
      price_amount: usdAmount,
      price_currency: 'USD',
      pay_currency: payCurrency.toUpperCase(),
      order_id: orderId,
      order_description: orderDescription || `Payment for $${usdAmount}`,
      purchase_id: orderId
    }

    const payment = await this.createPayment(paymentRequest)

    // Generate QR code URL
    const qrCodeUrl = this.generateQRCodeUrl(payment.pay_address, payment.pay_amount, payment.pay_currency)

    // Generate explorer URL if possible
    const explorerUrl = this.generateExplorerUrl(payment.pay_currency, payment.network)

    return {
      paymentId: payment.payment_id,
      payAddress: payment.pay_address,
      payAmount: payment.pay_amount,
      payCurrency: payment.pay_currency,
      priceAmount: payment.price_amount,
      priceCurrency: payment.price_currency,
      paymentStatus: payment.payment_status,
      network: this.getNetworkName(payment.pay_currency),
      qrCodeUrl,
      explorerUrl,
      expiresAt: payment.expiration_estimate_date,
      timeLimit: payment.time_limit,
      orderDescription: payment.order_description,
      purchaseId: payment.purchase_id
    }
  }

  // Generate QR code URL
  private generateQRCodeUrl(address: string, amount: number, currency: string): string {
    let qrContent = ''
    const currencyLower = currency.toLowerCase()

    if (currencyLower === 'btc') {
      qrContent = `bitcoin:${address}?amount=${amount}`
    } else if (currencyLower === 'eth' || currencyLower.includes('erc20')) {
      qrContent = `ethereum:${address}?value=${amount}`
    } else {
      qrContent = address
    }

    const params = new URLSearchParams({
      size: '300x300',
      data: qrContent,
      format: 'png',
      bgcolor: 'ffffff',
      color: '000000',
      margin: '10'
    })

    return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`
  }

  // Generate explorer URL
  private generateExplorerUrl(currency: string, network?: string): string | undefined {
    const currencyLower = currency.toLowerCase()

    if (currencyLower === 'btc') {
      return 'https://blockstream.info/address/'
    } else if (currencyLower === 'eth' || currencyLower.includes('erc20')) {
      return 'https://etherscan.io/address/'
    } else if (currencyLower.includes('trc20') || network?.toLowerCase().includes('tron')) {
      return 'https://tronscan.org/#/address/'
    }

    return undefined
  }

  // Get network name for currency
  private getNetworkName(currency: string): string {
    const currencyLower = currency.toLowerCase()

    if (currencyLower === 'btc') {
      return 'Bitcoin'
    } else if (currencyLower === 'eth') {
      return 'Ethereum'
    } else if (currencyLower.includes('erc20')) {
      return 'ERC20'
    } else if (currencyLower.includes('trc20')) {
      return 'TRC20'
    } else if (currencyLower.includes('bep20')) {
      return 'BEP20'
    }

    return 'Unknown'
  }

  // Validate webhook signature (for IPN)
  validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const crypto = require('crypto')
    const hmac = crypto.createHmac('sha512', secret)
    hmac.update(payload)
    const calculatedSignature = hmac.digest('hex')

    return calculatedSignature === signature
  }

  // Format currency for display
  formatCurrency(amount: number, currency: string, decimals: number = 8): string {
    const formatted = amount.toFixed(decimals)
    return `${formatted} ${currency.toUpperCase()}`
  }

  // Check if currency is supported
  async isCurrencySupported(currency: string): Promise<boolean> {
    const currencies = await this.getPaymentCurrencies()
    return currencies.some(c => c.currency.toLowerCase() === currency.toLowerCase())
  }

  // Helper method to determine if a currency is popular
  private isPopularCurrency(currencyCode: string): boolean {
    const popular = ['btc', 'eth', 'usdt', 'usdc', 'ltc', 'doge', 'bnb', 'ada', 'dot', 'sol']
    return popular.includes(currencyCode.toLowerCase()) || currencyCode.toLowerCase().includes('usdt')
  }

  // Helper method to determine if a currency is a stablecoin
  private isStablecoin(currencyCode: string): boolean {
    const stablecoins = ['usdt', 'usdc', 'dai', 'busd', 'tusd', 'usdp']
    const code = currencyCode.toLowerCase()
    return stablecoins.some(stable => code.includes(stable))
  }
}

// Create service instance
const createNOWPaymentsService = (): NOWPaymentsService => {
  const config: NOWPaymentsConfig = {
    apiKey: process.env.NOWPAYMENTS_API_KEY || '',
    sandboxMode: false, // Use production API for now
    baseUrl: 'https://api.nowpayments.io', // Always use production API
    ipnCallbackUrl: process.env.NOWPAYMENTS_IPN_URL
  }

  if (!config.apiKey) {
    throw new Error('NOWPAYMENTS_API_KEY environment variable is required')
  }

  return new NOWPaymentsService(config)
}

// Export singleton instance
export const nowPaymentsService = createNOWPaymentsService()

