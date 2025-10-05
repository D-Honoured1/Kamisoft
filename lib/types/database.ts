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

export type PaymentMethod = "paystack" | "nowpayments" | "bank_transfer"

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
  admin_discount_percent?: number
  payment_link_expiry?: string
  remaining_balance_link_active?: boolean
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
  paystack_reference?: string
  crypto_transaction_hash?: string
  crypto_address?: string
  crypto_network?: string
  crypto_amount?: number
  crypto_symbol?: string
  metadata?: string
  manual_entry?: boolean
  admin_verified?: boolean
  verification_date?: string
  verified_by_admin_id?: string
  payment_source?: "online" | "manual" | "bulk_import"
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

// ============================================
// DYNAMIC CONTENT TYPES
// ============================================

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt?: string
  content: string
  meta_title?: string
  meta_description?: string
  meta_keywords?: string[]
  cover_image_url?: string
  cover_image_alt?: string
  category?: string
  tags?: string[]
  author_id?: string
  author_name?: string
  is_published: boolean
  is_featured: boolean
  published_at?: string
  view_count: number
  read_time_minutes?: number
  created_at: string
  updated_at: string

  // Relations
  author?: StaffProfile
}

export interface Testimonial {
  id: string
  client_name: string
  client_position?: string
  client_company?: string
  client_email?: string
  message: string
  rating?: number
  project_title?: string
  service_category?: ServiceCategory
  project_year?: number
  project_value?: number
  client_image_url?: string
  client_image_alt?: string
  company_logo_url?: string
  video_url?: string
  video_thumbnail_url?: string
  is_published: boolean
  is_featured: boolean
  display_order: number
  is_verified: boolean
  verified_at?: string
  verified_by_admin_id?: string
  created_at: string
  updated_at: string

  // Relations
  verified_by?: StaffProfile
}

export interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  tags?: string[]
  is_published: boolean
  display_order: number
  view_count: number
  helpful_count: number
  not_helpful_count: number
  related_service_category?: ServiceCategory
  related_blog_post_id?: string
  created_at: string
  updated_at: string

  // Relations
  related_blog_post?: BlogPost
}

export interface TeamMember {
  id: string
  full_name: string
  display_name?: string
  position: string
  department?: string
  bio?: string
  short_bio?: string
  years_of_experience?: number
  specializations?: string[]
  certifications?: string[]
  education?: string
  email?: string
  phone?: string
  linkedin_url?: string
  github_url?: string
  twitter_url?: string
  portfolio_url?: string
  profile_image_url?: string
  profile_image_alt?: string
  cover_image_url?: string
  team_type: string
  is_public: boolean
  is_featured: boolean
  display_order: number
  employment_status: string
  joined_date?: string
  left_date?: string
  created_at: string
  updated_at: string
}

export interface CaseStudy {
  id: string
  title: string
  slug: string
  subtitle?: string
  client_name?: string
  client_industry?: string
  client_size?: string
  is_client_confidential: boolean
  service_category: ServiceCategory
  project_type?: string
  challenge: string
  solution: string
  results: string
  key_metrics?: Record<string, any>
  technologies: string[]
  tech_stack_frontend?: string[]
  tech_stack_backend?: string[]
  tech_stack_infrastructure?: string[]
  project_duration_months?: number
  team_size?: number
  start_date?: string
  completion_date?: string
  featured_image_url?: string
  featured_image_alt?: string
  gallery_images?: Array<{ url: string; alt?: string; caption?: string }>
  video_url?: string
  live_url?: string
  github_url?: string
  documentation_url?: string
  testimonial_id?: string
  is_published: boolean
  is_featured: boolean
  published_at?: string
  view_count: number
  meta_title?: string
  meta_description?: string
  meta_keywords?: string[]
  created_at: string
  updated_at: string

  // Relations
  testimonial?: Testimonial
}

export interface ContentActivityLog {
  id: string
  table_name: string
  record_id: string
  action: string
  admin_id?: string
  admin_email?: string
  changes?: Record<string, any>
  created_at: string

  // Relations
  admin?: StaffProfile
}

// ============================================
// FORM TYPES FOR DYNAMIC CONTENT
// ============================================

export interface BlogPostForm {
  title: string
  slug?: string
  excerpt?: string
  content: string
  meta_title?: string
  meta_description?: string
  meta_keywords?: string[]
  cover_image_url?: string
  cover_image_alt?: string
  category?: string
  tags?: string[]
  author_name?: string
  is_published: boolean
  is_featured: boolean
  read_time_minutes?: number
}

export interface TestimonialForm {
  client_name: string
  client_position?: string
  client_company?: string
  client_email?: string
  message: string
  rating?: number
  project_title?: string
  service_category?: ServiceCategory
  project_year?: number
  client_image_url?: string
  company_logo_url?: string
  video_url?: string
  is_published: boolean
  is_featured: boolean
  display_order?: number
}

export interface FAQForm {
  question: string
  answer: string
  category: string
  tags?: string[]
  is_published: boolean
  display_order?: number
  related_service_category?: ServiceCategory
}

export interface TeamMemberForm {
  full_name: string
  display_name?: string
  position: string
  department?: string
  bio?: string
  short_bio?: string
  years_of_experience?: number
  specializations?: string[]
  certifications?: string[]
  education?: string
  email?: string
  phone?: string
  linkedin_url?: string
  github_url?: string
  twitter_url?: string
  portfolio_url?: string
  profile_image_url?: string
  team_type: string
  is_public: boolean
  is_featured: boolean
  employment_status: string
  joined_date?: string
}

export interface CaseStudyForm {
  title: string
  slug?: string
  subtitle?: string
  client_name?: string
  client_industry?: string
  client_size?: string
  is_client_confidential: boolean
  service_category: ServiceCategory
  project_type?: string
  challenge: string
  solution: string
  results: string
  key_metrics?: Record<string, any>
  technologies: string[]
  tech_stack_frontend?: string[]
  tech_stack_backend?: string[]
  tech_stack_infrastructure?: string[]
  project_duration_months?: number
  team_size?: number
  start_date?: string
  completion_date?: string
  featured_image_url?: string
  gallery_images?: Array<{ url: string; alt?: string; caption?: string }>
  video_url?: string
  live_url?: string
  github_url?: string
  is_published: boolean
  is_featured: boolean
  meta_title?: string
  meta_description?: string
}
