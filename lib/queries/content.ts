import { createServerClient } from "@/lib/supabase/server"
import type {
  BlogPost,
  BlogPostForm,
  Testimonial,
  TestimonialForm,
  FAQ,
  FAQForm,
  TeamMember,
  TeamMemberForm,
  CaseStudy,
  CaseStudyForm,
  Product,
  ProductForm,
} from "@/lib/types/database"

// ============================================
// BLOG POSTS
// ============================================

export async function getAllBlogPosts(options?: {
  published_only?: boolean
  limit?: number
  offset?: number
}) {
  const supabase = createServerClient()
  let query = supabase
    .from("blog_posts")
    .select("*, author:staff_profiles(first_name, last_name)")
    .order("created_at", { ascending: false })

  if (options?.published_only) {
    query = query.eq("is_published", true)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, error } = await query

  if (error) throw error
  return data as BlogPost[]
}

export async function getBlogPostById(id: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*, author:staff_profiles(first_name, last_name)")
    .eq("id", id)
    .single()

  if (error) throw error
  return data as BlogPost
}

export async function getBlogPostBySlug(slug: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*, author:staff_profiles(first_name, last_name)")
    .eq("slug", slug)
    .single()

  if (error) throw error
  return data as BlogPost
}

export async function createBlogPost(post: BlogPostForm) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("blog_posts")
    .insert([post])
    .select()
    .single()

  if (error) throw error
  return data as BlogPost
}

export async function updateBlogPost(id: string, post: Partial<BlogPostForm>) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("blog_posts")
    .update(post)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as BlogPost
}

export async function deleteBlogPost(id: string) {
  const supabase = createServerClient()
  const { error } = await supabase.from("blog_posts").delete().eq("id", id)

  if (error) throw error
}

export async function incrementBlogPostViews(id: string) {
  const supabase = createServerClient()
  const { error } = await supabase.rpc("increment_view_count", {
    p_table_name: "blog_posts",
    p_record_id: id,
  })

}

// ============================================
// TESTIMONIALS
// ============================================

export async function getAllTestimonials(options?: {
  published_only?: boolean
  featured_only?: boolean
  limit?: number
}) {
  const supabase = createServerClient()
  let query = supabase
    .from("testimonials")
    .select("*")
    .order("display_order", { ascending: true })

  if (options?.published_only) {
    query = query.eq("is_published", true)
  }

  if (options?.featured_only) {
    query = query.eq("is_featured", true)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) throw error
  return data as Testimonial[]
}

export async function getTestimonialById(id: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("testimonials").select("*").eq("id", id).single()

  if (error) throw error
  return data as Testimonial
}

export async function createTestimonial(testimonial: TestimonialForm) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("testimonials")
    .insert([testimonial])
    .select()
    .single()

  if (error) throw error
  return data as Testimonial
}

export async function updateTestimonial(id: string, testimonial: Partial<TestimonialForm>) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("testimonials")
    .update(testimonial)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Testimonial
}

export async function deleteTestimonial(id: string) {
  const supabase = createServerClient()
  const { error } = await supabase.from("testimonials").delete().eq("id", id)

  if (error) throw error
}

export async function verifyTestimonial(id: string, adminId: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("testimonials")
    .update({
      is_verified: true,
      verified_at: new Date().toISOString(),
      verified_by_admin_id: adminId,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Testimonial
}

// ============================================
// FAQs
// ============================================

export async function getAllFAQs(options?: { published_only?: boolean; category?: string }) {
  const supabase = createServerClient()
  let query = supabase
    .from("faqs")
    .select("*")
    .order("category", { ascending: true })
    .order("display_order", { ascending: true })

  if (options?.published_only) {
    query = query.eq("is_published", true)
  }

  if (options?.category) {
    query = query.eq("category", options.category)
  }

  const { data, error } = await query

  if (error) throw error
  return data as FAQ[]
}

export async function getFAQsByCategory() {
  const supabase = createServerClient()
  const faqs = await getAllFAQs({ published_only: true })

  // Group by category
  const grouped: Record<string, FAQ[]> = {}
  faqs.forEach((faq) => {
    if (!grouped[faq.category]) {
      grouped[faq.category] = []
    }
    grouped[faq.category].push(faq)
  })

  return grouped
}

export async function getFAQById(id: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("faqs").select("*").eq("id", id).single()

  if (error) throw error
  return data as FAQ
}

export async function createFAQ(faq: FAQForm) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("faqs").insert([faq]).select().single()

  if (error) throw error
  return data as FAQ
}

export async function updateFAQ(id: string, faq: Partial<FAQForm>) {
  const supabase = createServerClient()
  const { data, error} = await supabase.from("faqs").update(faq).eq("id", id).select().single()

  if (error) throw error
  return data as FAQ
}

export async function deleteFAQ(id: string) {
  const supabase = createServerClient()
  const { error } = await supabase.from("faqs").delete().eq("id", id)

  if (error) throw error
}

// ============================================
// TEAM MEMBERS
// ============================================

export async function getAllTeamMembers(options?: {
  public_only?: boolean
  team_type?: string
  active_only?: boolean
}) {
  const supabase = createServerClient()
  let query = supabase
    .from("team_members")
    .select("*")
    .order("display_order", { ascending: true })

  if (options?.public_only) {
    query = query.eq("is_public", true)
  }

  if (options?.team_type) {
    query = query.eq("team_type", options.team_type)
  }

  if (options?.active_only) {
    query = query.eq("employment_status", "active")
  }

  const { data, error } = await query

  if (error) throw error
  return data as TeamMember[]
}

export async function getTeamMemberById(id: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("team_members").select("*").eq("id", id).single()

  if (error) throw error
  return data as TeamMember
}

export async function createTeamMember(member: TeamMemberForm) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("team_members").insert([member]).select().single()

  if (error) throw error
  return data as TeamMember
}

export async function updateTeamMember(id: string, member: Partial<TeamMemberForm>) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("team_members")
    .update(member)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as TeamMember
}

export async function deleteTeamMember(id: string) {
  const supabase = createServerClient()
  const { error } = await supabase.from("team_members").delete().eq("id", id)

  if (error) throw error
}

// ============================================
// CASE STUDIES
// ============================================

export async function getAllCaseStudies(options?: {
  published_only?: boolean
  featured_only?: boolean
  service_category?: string
  limit?: number
}) {
  const supabase = createServerClient()
  let query = supabase
    .from("case_studies")
    .select("*, testimonial:testimonials(*)")
    .order("published_at", { ascending: false })

  if (options?.published_only) {
    query = query.eq("is_published", true)
  }

  if (options?.featured_only) {
    query = query.eq("is_featured", true)
  }

  if (options?.service_category) {
    query = query.eq("service_category", options.service_category)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) throw error
  return data as CaseStudy[]
}

export async function getCaseStudyById(id: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("case_studies")
    .select("*, testimonial:testimonials(*)")
    .eq("id", id)
    .single()

  if (error) throw error
  return data as CaseStudy
}

export async function getCaseStudyBySlug(slug: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("case_studies")
    .select("*, testimonial:testimonials(*)")
    .eq("slug", slug)
    .single()

  if (error) throw error
  return data as CaseStudy
}

export async function createCaseStudy(caseStudy: CaseStudyForm) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("case_studies")
    .insert([caseStudy])
    .select()
    .single()

  if (error) throw error
  return data as CaseStudy
}

export async function updateCaseStudy(id: string, caseStudy: Partial<CaseStudyForm>) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("case_studies")
    .update(caseStudy)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as CaseStudy
}

export async function deleteCaseStudy(id: string) {
  const supabase = createServerClient()
  const { error } = await supabase.from("case_studies").delete().eq("id", id)

  if (error) throw error
}

export async function incrementCaseStudyViews(id: string) {
  const supabase = createServerClient()
  const { error } = await supabase.rpc("increment_view_count", {
    p_table_name: "case_studies",
    p_record_id: id,
  })

}

// ============================================
// PRODUCTS
// ============================================

export async function getAllProducts(options?: { active_only?: boolean }) {
  const supabase = createServerClient()
  let query = supabase.from("products").select("*").order("launch_date", { ascending: false })

  if (options?.active_only) {
    query = query.eq("is_active", true)
  }

  const { data, error } = await query
  if (error) throw error
  return data as Product[]
}

export async function getProductById(id: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("products").select("*").eq("id", id).single()

  if (error) throw error
  return data as Product
}

export async function createProduct(productData: ProductForm) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("products").insert([productData]).select().single()

  if (error) throw error
  return data as Product
}

export async function updateProduct(id: string, productData: Partial<ProductForm>) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("products").update(productData).eq("id", id).select().single()

  if (error) throw error
  return data as Product
}

export async function deleteProduct(id: string) {
  const supabase = createServerClient()
  const { error } = await supabase.from("products").delete().eq("id", id)

  if (error) throw error
}
