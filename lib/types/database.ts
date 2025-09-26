// Database types for Kamisoft Enterprises
// Auto-generated from Supabase schema

export type ServiceCategory =
  | "full_stack_development"
  | "mobile_app_development"
  | "blockchain_solutions"
  | "fintech_platforms"
  | "networking_ccna"
  | "consultancy"
  | "cloud_devops"
  | "ai_automation"

export type RequestType = "digital" | "on_site"

export type RequestStatus = "pending" | "in_progress" | "completed" | "cancelled"

export type PaymentStatus = "pending" | "processing" | "completed" | "failed" | "refunded"

export type PaymentMethod = "stripe" | "paystack" | "nowpayments" | "bank_transfer"

export type PaymentPlan = "full" | "split"

export type PartialPaymentStatus = "none" | "first_paid" | "completed"

export type PaymentType = "full" | "split"

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled"

export interface Client {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  address?: string
  created_at: string
  updated_at: string
}

// lib/types/database.ts - FIXED ServiceRequest interface

export interface ServiceRequest {
  id: string
  client_id: string
  service_category: ServiceCategory
  request_type: RequestType
  title: string
  description: string
  status: RequestStatus
  preferred_date?: string
  site_address?: string
  estimated_cost?: number
  final_cost?: number
  priority?: string
  requirements?: string
  timeline?: string
  request_source?: string
  total_paid?: number
  balance_due?: number
  payment_plan?: PaymentPlan
  partial_payment_status?: PartialPaymentStatus
  created_at: string
  updated_at: string

  // Relations - FIXED: singular "client" not "clients"
  client?: Client  // Changed from clients to client
  payments?: Payment[]
  invoices?: Invoice[]
  staff_assignments?: StaffAssignment[]
}

export interface Payment {
  id: string
  request_id: string
  amount: number
  currency: string
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  payment_type?: PaymentType
  payment_sequence?: number
  is_partial_payment?: boolean
  total_amount_due?: number
  admin_notes?: string
  stripe_payment_intent_id?: string
  paystack_reference?: string
  crypto_transaction_hash?: string
  crypto_address?: string
  crypto_network?: string
  crypto_amount?: number
  crypto_symbol?: string
  metadata?: string
  created_at: string
  updated_at: string

  // Relations
  service_request?: ServiceRequest
}

export interface Invoice {
  id: string
  request_id: string
  payment_id?: string
  invoice_number: string
  subtotal: number
  tax_amount: number
  total_amount: number
  status: InvoiceStatus
  due_date?: string
  pdf_url?: string
  created_at: string
  updated_at: string

  // Relations
  service_request?: ServiceRequest
  payment?: Payment
}

export interface StaffProfile {
  id: string
  first_name?: string
  last_name?: string
  role?: string
  department?: string
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface StaffAssignment {
  id: string
  request_id: string
  staff_id: string
  assigned_at: string
  notes?: string

  // Relations
  service_request?: ServiceRequest
  staff_profile?: StaffProfile
}

export interface PortfolioProject {
  id: string
  title: string
  description: string
  service_category: ServiceCategory
  client_name?: string
  project_url?: string
  github_url?: string
  featured_image_url?: string
  gallery_images?: string[]
  technologies?: string[]
  completion_date?: string
  is_featured: boolean
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  description: string
  category: string
  features?: string[]
  pricing_model?: string
  price?: number
  product_url?: string
  documentation_url?: string
  featured_image_url?: string
  is_active: boolean
  launch_date?: string
  created_at: string
  updated_at: string
}

export interface LeadershipTeam {
  id: string
  name: string
  position: string
  bio?: string
  email?: string
  linkedin_url?: string
  twitter_url?: string
  profile_image_url?: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// Form types for client-facing interfaces
export interface ServiceRequestForm {
  name: string
  email: string
  phone?: string
  company?: string
  service_category: ServiceCategory
  request_type: RequestType
  title: string
  description: string
  preferred_date?: string
  site_address?: string
}

export interface ContactForm {
  name: string
  email: string
  message: string
  phone?: string
  company?: string
}
