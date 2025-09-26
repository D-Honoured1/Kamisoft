// lib/crypto/index.ts - Cryptocurrency payment service
import crypto from 'crypto'

// Supported cryptocurrency networks and their details
export interface CryptoNetwork {
  id: string
  name: string
  symbol: string
  network: string
  decimals: number
  minAmount: number
  maxAmount: number
  estimatedConfirmations: number
  averageFeeUsd: number
  isStablecoin: boolean
  explorerUrl: string
  addressPattern: RegExp
}

export const SUPPORTED_CRYPTO_NETWORKS: Record<string, CryptoNetwork> = {
  'usdt-trc20': {
    id: 'usdt-trc20',
    name: 'USDT (TRC20)',
    symbol: 'USDT',
    network: 'TRC20',
    decimals: 6,
    minAmount: 1,
    maxAmount: 50000,
    estimatedConfirmations: 19,
    averageFeeUsd: 1,
    isStablecoin: true,
    explorerUrl: 'https://tronscan.org/#/transaction/',
    addressPattern: /^T[A-Za-z1-9]{33}$/
  },
  'usdt-erc20': {
    id: 'usdt-erc20',
    name: 'USDT (ERC20)',
    symbol: 'USDT',
    network: 'ERC20',
    decimals: 6,
    minAmount: 10,
    maxAmount: 50000,
    estimatedConfirmations: 12,
    averageFeeUsd: 15,
    isStablecoin: true,
    explorerUrl: 'https://etherscan.io/tx/',
    addressPattern: /^0x[a-fA-F0-9]{40}$/
  },
  'usdc-erc20': {
    id: 'usdc-erc20',
    name: 'USDC (ERC20)',
    symbol: 'USDC',
    network: 'ERC20',
    decimals: 6,
    minAmount: 10,
    maxAmount: 50000,
    estimatedConfirmations: 12,
    averageFeeUsd: 15,
    isStablecoin: true,
    explorerUrl: 'https://etherscan.io/tx/',
    addressPattern: /^0x[a-fA-F0-9]{40}$/
  },
  'btc': {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    network: 'Bitcoin',
    decimals: 8,
    minAmount: 0.0001,
    maxAmount: 10,
    estimatedConfirmations: 3,
    averageFeeUsd: 5,
    isStablecoin: false,
    explorerUrl: 'https://blockstream.info/tx/',
    addressPattern: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/
  },
  'eth': {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    network: 'Ethereum',
    decimals: 18,
    minAmount: 0.001,
    maxAmount: 100,
    estimatedConfirmations: 12,
    averageFeeUsd: 10,
    isStablecoin: false,
    explorerUrl: 'https://etherscan.io/tx/',
    addressPattern: /^0x[a-fA-F0-9]{40}$/
  }
}

// Your wallet addresses for receiving payments
export const CRYPTO_ADDRESSES: Record<string, string> = {
  'usdt-trc20': process.env.CRYPTO_USDT_TRC20_ADDRESS || 'TYourUSDTTRC20AddressHere',
  'usdt-erc20': process.env.CRYPTO_USDT_ERC20_ADDRESS || '0xYourUSDTERC20AddressHere',
  'usdc-erc20': process.env.CRYPTO_USDC_ERC20_ADDRESS || '0xYourUSDCERC20AddressHere',
  'btc': process.env.CRYPTO_BTC_ADDRESS || 'bc1YourBitcoinAddressHere',
  'eth': process.env.CRYPTO_ETH_ADDRESS || '0xYourEthereumAddressHere'
}

export interface CryptoPaymentDetails {
  networkId: string
  network: CryptoNetwork
  address: string
  amount: number
  amountCrypto: number
  usdAmount: number
  exchangeRate: number
  qrCodeUrl: string
  paymentReference: string
  expiresAt: string
  instructions: string[]
  fees: {
    networkFeeUsd: number
    estimatedTotal: number
  }
}

export interface CryptoPrice {
  symbol: string
  price: number
  change24h: number
  lastUpdated: string
  source: string
}

export class CryptoPaymentService {
  private priceCache = new Map<string, { price: CryptoPrice; timestamp: number }>()
  private cacheTimeout = 2 * 60 * 1000 // 2 minutes for crypto prices

  constructor() {
    // Validate addresses on startup
    this.validateAddresses()
  }

  private validateAddresses() {
    for (const [networkId, address] of Object.entries(CRYPTO_ADDRESSES)) {
      const network = SUPPORTED_CRYPTO_NETWORKS[networkId]
      if (network && !network.addressPattern.test(address)) {
        console.warn(`⚠️ Invalid ${networkId} address: ${address}`)
      }
    }
  }

  // Fetch real-time crypto prices
  async getCryptoPrice(symbol: string): Promise<CryptoPrice> {
    const cacheKey = symbol.toLowerCase()
    const cached = this.priceCache.get(cacheKey)

    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.price
    }

    try {
      // Using CoinGecko API (free tier)
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${this.getCoingeckoId(symbol)}&vs_currencies=usd&include_24hr_change=true`,
        {
          headers: {
            'User-Agent': 'KamisoftPaymentSystem/1.0'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Price API returned ${response.status}`)
      }

      const data = await response.json()
      const coingeckoId = this.getCoingeckoId(symbol)
      const priceData = data[coingeckoId]

      if (!priceData) {
        throw new Error(`Price data not found for ${symbol}`)
      }

      const price: CryptoPrice = {
        symbol: symbol.toUpperCase(),
        price: priceData.usd,
        change24h: priceData.usd_24h_change || 0,
        lastUpdated: new Date().toISOString(),
        source: 'CoinGecko'
      }

      this.priceCache.set(cacheKey, {
        price,
        timestamp: Date.now()
      })

      return price
    } catch (error: any) {
      console.warn(`⚠️ Failed to fetch ${symbol} price:`, error.message)

      // Fallback to hardcoded prices for stablecoins
      if (symbol.toLowerCase().includes('usd')) {
        return {
          symbol: symbol.toUpperCase(),
          price: 1.00,
          change24h: 0,
          lastUpdated: new Date().toISOString(),
          source: 'fallback'
        }
      }

      throw new Error(`Unable to fetch price for ${symbol}`)
    }
  }

  private getCoingeckoId(symbol: string): string {
    const mapping: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'USDT': 'tether',
      'USDC': 'usd-coin'
    }
    return mapping[symbol.toUpperCase()] || symbol.toLowerCase()
  }

  // Generate crypto payment details
  async generatePaymentDetails(
    networkId: string,
    usdAmount: number,
    paymentReference: string
  ): Promise<CryptoPaymentDetails> {
    const network = SUPPORTED_CRYPTO_NETWORKS[networkId]
    if (!network) {
      throw new Error(`Unsupported network: ${networkId}`)
    }

    const address = CRYPTO_ADDRESSES[networkId]
    if (!address) {
      throw new Error(`No address configured for ${networkId}`)
    }

    // Validate amount limits
    if (usdAmount < network.minAmount || usdAmount > network.maxAmount) {
      throw new Error(
        `Amount must be between $${network.minAmount} and $${network.maxAmount} for ${network.name}`
      )
    }

    // Get current crypto price
    let cryptoPrice: CryptoPrice
    let amountCrypto: number

    if (network.isStablecoin) {
      // For stablecoins, 1:1 ratio with USD
      cryptoPrice = {
        symbol: network.symbol,
        price: 1.00,
        change24h: 0,
        lastUpdated: new Date().toISOString(),
        source: 'stablecoin'
      }
      amountCrypto = usdAmount
    } else {
      // Fetch real price for non-stablecoins
      cryptoPrice = await this.getCryptoPrice(network.symbol)
      amountCrypto = usdAmount / cryptoPrice.price
    }

    // Round to appropriate decimals
    amountCrypto = Math.round(amountCrypto * Math.pow(10, network.decimals)) / Math.pow(10, network.decimals)

    // Generate QR code URL
    const qrCodeUrl = this.generateQRCode(networkId, address, amountCrypto, paymentReference)

    // Calculate expiration (24 hours)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    return {
      networkId,
      network,
      address,
      amount: amountCrypto,
      amountCrypto,
      usdAmount,
      exchangeRate: cryptoPrice.price,
      qrCodeUrl,
      paymentReference,
      expiresAt,
      instructions: this.generateInstructions(network, address, amountCrypto, paymentReference),
      fees: {
        networkFeeUsd: network.averageFeeUsd,
        estimatedTotal: usdAmount + network.averageFeeUsd
      }
    }
  }

  private generateQRCode(networkId: string, address: string, amount: number, reference: string): string {
    let qrContent = ''

    switch (networkId) {
      case 'btc':
        qrContent = `bitcoin:${address}?amount=${amount}&message=${reference}`
        break
      case 'eth':
      case 'usdt-erc20':
      case 'usdc-erc20':
        qrContent = `ethereum:${address}?value=${amount}&gas=21000`
        break
      case 'usdt-trc20':
        qrContent = address // Simple address for TRC20
        break
      default:
        qrContent = address
    }

    // Generate QR code using external service
    const qrCodeBase = 'https://api.qrserver.com/v1/create-qr-code/'
    const params = new URLSearchParams({
      size: '300x300',
      data: qrContent,
      format: 'png',
      bgcolor: 'ffffff',
      color: '000000',
      margin: '10'
    })

    return `${qrCodeBase}?${params.toString()}`
  }

  private generateInstructions(
    network: CryptoNetwork,
    address: string,
    amount: number,
    reference: string
  ): string[] {
    const baseInstructions = [
      `Send exactly ${amount} ${network.symbol} to the address above`,
      `Network: ${network.network}`,
      `Reference: ${reference}`,
      `Wait for ${network.estimatedConfirmations} confirmations`,
      `Estimated network fee: ~$${network.averageFeeUsd}`,
      'Send transaction hash to hello@kamisoftenterprises.online',
      'Payment will be verified within 1-2 hours'
    ]

    // Add network-specific instructions
    switch (network.network) {
      case 'TRC20':
        baseInstructions.splice(2, 0, 'Use TRC20 network (Tron) for lower fees')
        break
      case 'ERC20':
        baseInstructions.splice(2, 0, 'Use ERC20 network (Ethereum) - higher fees but more widely supported')
        break
      case 'Bitcoin':
        baseInstructions.splice(2, 0, 'Use Bitcoin mainnet only')
        break
    }

    return baseInstructions
  }

  // Validate transaction hash format
  validateTransactionHash(networkId: string, txHash: string): boolean {
    const network = SUPPORTED_CRYPTO_NETWORKS[networkId]
    if (!network) return false

    switch (network.network) {
      case 'Bitcoin':
        return /^[a-fA-F0-9]{64}$/.test(txHash)
      case 'Ethereum':
      case 'ERC20':
        return /^0x[a-fA-F0-9]{64}$/.test(txHash)
      case 'TRC20':
        return /^[a-fA-F0-9]{64}$/.test(txHash)
      default:
        return txHash.length >= 32 && txHash.length <= 128
    }
  }

  // Get explorer URL for transaction
  getExplorerUrl(networkId: string, txHash: string): string {
    const network = SUPPORTED_CRYPTO_NETWORKS[networkId]
    return network ? `${network.explorerUrl}${txHash}` : '#'
  }

  // Get all supported networks
  getSupportedNetworks(): CryptoNetwork[] {
    return Object.values(SUPPORTED_CRYPTO_NETWORKS)
  }

  // Get network by ID
  getNetwork(networkId: string): CryptoNetwork | null {
    return SUPPORTED_CRYPTO_NETWORKS[networkId] || null
  }
}

// Export singleton instance
export const cryptoPaymentService = new CryptoPaymentService()

// Export types
export type {
  CryptoNetwork,
  CryptoPaymentDetails,
  CryptoPrice
}