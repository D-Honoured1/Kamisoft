// lib/invoice/index.ts - Invoice Generation Service
import { createServerClient } from "@/lib/supabase/server"

export interface InvoiceData {
  requestId: string
  paymentId?: string
  clientName: string
  clientEmail: string
  clientCompany?: string
  clientAddress?: string
  serviceTitle: string
  serviceDescription: string
  serviceCategory: string
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    amount: number
  }>
  subtotal: number
  taxRate: number
  taxAmount: number
  totalAmount: number
  dueDate?: Date
  notes?: string
}

export interface GeneratedInvoice {
  id: string
  invoiceNumber: string
  pdfUrl: string | null
  status: string
}

export class InvoiceService {
  /**
   * Generate a unique invoice number
   * Format: INV-YYYY-XXXX (e.g., INV-2025-0001)
   */
  static async generateInvoiceNumber(): Promise<string> {
    const supabase = createServerClient()
    const year = new Date().getFullYear()

    // Get the count of invoices for this year
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('invoice_number')
      .like('invoice_number', `INV-${year}-%`)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error fetching invoices:', error)
    }

    let sequence = 1
    if (invoices && invoices.length > 0) {
      const lastInvoice = invoices[0]
      const lastSequence = parseInt(lastInvoice.invoice_number.split('-')[2])
      sequence = lastSequence + 1
    }

    return `INV-${year}-${sequence.toString().padStart(4, '0')}`
  }

  /**
   * Create invoice data from service request
   */
  static async prepareInvoiceData(requestId: string, paymentId?: string): Promise<InvoiceData | null> {
    const supabase = createServerClient()

    // Fetch service request with client details
    const { data: request, error } = await supabase
      .from('service_requests')
      .select(`
        *,
        clients (
          id,
          name,
          email,
          company,
          address
        )
      `)
      .eq('id', requestId)
      .single()

    if (error || !request) {
      console.error('Error fetching service request:', error)
      return null
    }

    const client = (request as any).clients
    const finalCost = request.final_cost || request.estimated_cost || 0

    // Calculate tax (7.5% VAT for Nigeria, adjust as needed)
    const taxRate = 0.075
    const subtotal = finalCost
    const taxAmount = subtotal * taxRate
    const totalAmount = subtotal + taxAmount

    // Create invoice items
    const items = [{
      description: request.title || 'Software Development Services',
      quantity: 1,
      unitPrice: subtotal,
      amount: subtotal
    }]

    // Add additional breakdown if needed
    if (request.description) {
      items[0].description += ` - ${request.description.substring(0, 100)}`
    }

    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30) // 30 days payment terms

    return {
      requestId: request.id,
      paymentId,
      clientName: client?.name || 'Unknown Client',
      clientEmail: client?.email || '',
      clientCompany: client?.company,
      clientAddress: client?.address,
      serviceTitle: request.title || 'Service Request',
      serviceDescription: request.description || '',
      serviceCategory: request.service_category || '',
      items,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      dueDate,
      notes: 'Payment is due within 30 days. Thank you for your business!'
    }
  }

  /**
   * Create invoice record in database
   */
  static async createInvoice(
    invoiceData: InvoiceData,
    pdfUrl?: string
  ): Promise<GeneratedInvoice | null> {
    const supabase = createServerClient()
    const invoiceNumber = await this.generateInvoiceNumber()

    const { data, error } = await supabase
      .from('invoices')
      .insert({
        request_id: invoiceData.requestId,
        payment_id: invoiceData.paymentId,
        invoice_number: invoiceNumber,
        subtotal: invoiceData.subtotal,
        tax_amount: invoiceData.taxAmount,
        total_amount: invoiceData.totalAmount,
        status: 'draft',
        due_date: invoiceData.dueDate?.toISOString().split('T')[0],
        pdf_url: pdfUrl
      })
      .select('id, invoice_number, pdf_url, status')
      .single()

    if (error) {
      console.error('Error creating invoice:', error)
      return null
    }

    return data as GeneratedInvoice
  }

  /**
   * Update invoice status
   */
  static async updateInvoiceStatus(
    invoiceId: string,
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  ): Promise<boolean> {
    const supabase = createServerClient()

    const { error } = await supabase
      .from('invoices')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)

    if (error) {
      console.error('Error updating invoice status:', error)
      return false
    }

    return true
  }

  /**
   * Get invoice by ID
   */
  static async getInvoice(invoiceId: string) {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        service_requests (
          *,
          clients (*)
        ),
        payments (*)
      `)
      .eq('id', invoiceId)
      .single()

    if (error) {
      console.error('Error fetching invoice:', error)
      return null
    }

    return data
  }

  /**
   * Get invoices for a service request
   */
  static async getInvoicesForRequest(requestId: string) {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invoices:', error)
      return []
    }

    return data || []
  }

  /**
   * List all invoices (admin)
   */
  static async listInvoices(filters?: {
    status?: string
    limit?: number
    offset?: number
  }) {
    const supabase = createServerClient()

    let query = supabase
      .from('invoices')
      .select(`
        *,
        service_requests (
          title,
          clients (name, email, company)
        )
      `)
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error listing invoices:', error)
      return { invoices: [], total: 0 }
    }

    return {
      invoices: data || [],
      total: data?.length || 0
    }
  }
}

export default InvoiceService