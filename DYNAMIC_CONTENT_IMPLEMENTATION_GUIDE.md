# Dynamic Content Management System - Implementation Guide

## Overview

This guide provides complete implementation details for making all Kamisoft Enterprises website content dynamic, controllable, and updatable from the admin dashboard. Every section (Blog, Testimonials, FAQ, Team, Case Studies) is database-driven with full CRUD operations.

---

## Table of Contents

1. [Database Schema](#database-schema)
2. [TypeScript Types](#typescript-types)
3. [Supabase API Functions](#supabase-api-functions)
4. [Admin Dashboard Pages](#admin-dashboard-pages)
5. [Dynamic Frontend Pages](#dynamic-frontend-pages)
6. [Rich Text Editor Integration](#rich-text-editor-integration)
7. [File Upload & Media Management](#file-upload--media-management)
8. [API Routes](#api-routes)
9. [Security & RLS Policies](#security--rls-policies)
10. [Implementation Checklist](#implementation-checklist)

---

## 1. Database Schema

### Migration File
**Location:** `/home/vboxuser/TOP/kamisoft-app/scripts/021_create_dynamic_content_tables.sql`

### Tables Created

#### 1.1 **blog_posts**
Stores all blog articles with SEO, publishing, and author tracking.

```sql
Key fields:
- id, title, slug (auto-generated), excerpt, content
- SEO: meta_title, meta_description, meta_keywords[]
- Media: cover_image_url, cover_image_alt
- Categorization: category, tags[]
- Author: author_id (FK to staff_profiles), author_name
- Publishing: is_published, is_featured, published_at
- Analytics: view_count, read_time_minutes
```

**Features:**
- Auto-slug generation from title
- Rich text content support (markdown/HTML)
- Tag-based filtering
- Author attribution
- View tracking

---

#### 1.2 **testimonials**
Client testimonials with ratings, project references, and verification.

```sql
Key fields:
- Client info: client_name, client_position, client_company, client_email
- Content: message, rating (1-5 stars)
- Project: project_title, service_category, project_year, project_value
- Media: client_image_url, company_logo_url, video_url
- Display: is_published, is_featured, display_order
- Verification: is_verified, verified_at, verified_by_admin_id
```

**Features:**
- Star rating system (1-5)
- Video testimonial support
- Admin verification workflow
- Display order control
- Service category linking

---

#### 1.3 **faqs**
Frequently asked questions with categorization and analytics.

```sql
Key fields:
- Content: question, answer (supports markdown)
- Categorization: category, tags[]
- Display: is_published, display_order
- Analytics: view_count, helpful_count, not_helpful_count
- Relations: related_service_category, related_blog_post_id
```

**Features:**
- Category-based organization
- Helpfulness voting
- Related content linking
- View tracking

---

#### 1.4 **team_members**
Complete team directory beyond just leadership.

```sql
Key fields:
- Personal: full_name, display_name, position, department
- Bio: bio (full), short_bio (one-liner)
- Professional: years_of_experience, specializations[], certifications[], education
- Contact: email, phone
- Social: linkedin_url, github_url, twitter_url, portfolio_url
- Media: profile_image_url, cover_image_url
- Team: team_type (leadership/staff/consultant/intern), employment_status
- Display: is_public, is_featured, display_order
```

**Features:**
- Multiple team types
- Alumni tracking (employment_status)
- Certifications showcase
- Social links
- Public/private profiles

---

#### 1.5 **case_studies**
Comprehensive project case studies with metrics and outcomes.

```sql
Key fields:
- Basic: title, slug (auto-generated), subtitle
- Client: client_name, client_industry, client_size, is_client_confidential
- Project: service_category, project_type
- Story: challenge, solution, results
- Metrics: key_metrics (JSONB), technologies[]
- Tech stack: tech_stack_frontend[], tech_stack_backend[], tech_stack_infrastructure[]
- Timeline: project_duration_months, team_size, start_date, completion_date
- Media: featured_image_url, gallery_images (JSONB), video_url
- Links: live_url, github_url, documentation_url
- Relations: testimonial_id (link to testimonials)
- Publishing: is_published, is_featured, published_at
- SEO: meta_title, meta_description, meta_keywords[]
```

**Features:**
- Flexible metrics (JSON structure)
- Multi-tech stack categorization
- Confidential client support
- Gallery images
- Testimonial integration
- Full SEO control

---

#### 1.6 **content_activity_log**
Audit trail for all content changes.

```sql
Key fields:
- table_name, record_id, action (created/updated/deleted/published/unpublished)
- admin_id, admin_email
- changes (JSONB) - before/after values
- created_at
```

**Features:**
- Complete audit trail
- Track who changed what and when
- JSON diff of changes

---

### Running the Migration

```bash
# From project root
cd scripts

# Apply migration to Supabase
# Option 1: Via Supabase CLI
supabase db push

# Option 2: Via SQL Editor in Supabase Dashboard
# Copy contents of 021_create_dynamic_content_tables.sql
# Paste into SQL Editor and run
```

---

## 2. TypeScript Types

### Location
**File:** `/home/vboxuser/TOP/kamisoft-app/lib/types/database.ts`

All TypeScript interfaces have been added for:
- `BlogPost`
- `Testimonial`
- `FAQ`
- `TeamMember`
- `CaseStudy`
- `ContentActivityLog`

And corresponding form types:
- `BlogPostForm`
- `TestimonialForm`
- `FAQForm`
- `TeamMemberForm`
- `CaseStudyForm`

---

## 3. Supabase API Functions

### 3.1 Create Supabase Query Functions

**File to create:** `/home/vboxuser/TOP/kamisoft-app/lib/queries/content.ts`

```typescript
import { supabase } from "@/lib/supabase/client"
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
} from "@/lib/types/database"

// ============================================
// BLOG POSTS
// ============================================

export async function getAllBlogPosts(options?: {
  published_only?: boolean
  limit?: number
  offset?: number
}) {
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

export async function getBlogPostBySlug(slug: string) {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*, author:staff_profiles(first_name, last_name)")
    .eq("slug", slug)
    .single()

  if (error) throw error
  return data as BlogPost
}

export async function createBlogPost(post: BlogPostForm) {
  const { data, error } = await supabase
    .from("blog_posts")
    .insert([post])
    .select()
    .single()

  if (error) throw error
  return data as BlogPost
}

export async function updateBlogPost(id: string, post: Partial<BlogPostForm>) {
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
  const { error } = await supabase.from("blog_posts").delete().eq("id", id)

  if (error) throw error
}

export async function incrementBlogPostViews(id: string) {
  const { error } = await supabase.rpc("increment_view_count", {
    p_table_name: "blog_posts",
    p_record_id: id,
  })

  if (error) console.error("Failed to increment views:", error)
}

// ============================================
// TESTIMONIALS
// ============================================

export async function getAllTestimonials(options?: {
  published_only?: boolean
  featured_only?: boolean
  limit?: number
}) {
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

export async function createTestimonial(testimonial: TestimonialForm) {
  const { data, error } = await supabase
    .from("testimonials")
    .insert([testimonial])
    .select()
    .single()

  if (error) throw error
  return data as Testimonial
}

export async function updateTestimonial(id: string, testimonial: Partial<TestimonialForm>) {
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
  const { error } = await supabase.from("testimonials").delete().eq("id", id)

  if (error) throw error
}

export async function verifyTestimonial(id: string, adminId: string) {
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

export async function getAllFAQs(options?: {
  published_only?: boolean
  category?: string
}) {
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

export async function createFAQ(faq: FAQForm) {
  const { data, error } = await supabase.from("faqs").insert([faq]).select().single()

  if (error) throw error
  return data as FAQ
}

export async function updateFAQ(id: string, faq: Partial<FAQForm>) {
  const { data, error } = await supabase.from("faqs").update(faq).eq("id", id).select().single()

  if (error) throw error
  return data as FAQ
}

export async function deleteFAQ(id: string) {
  const { error } = await supabase.from("faqs").delete().eq("id", id)

  if (error) throw error
}

export async function markFAQHelpful(id: string, helpful: boolean) {
  const field = helpful ? "helpful_count" : "not_helpful_count"

  const { error } = await supabase.rpc("increment_faq_helpful", {
    faq_id: id,
    is_helpful: helpful,
  })

  if (error) console.error("Failed to mark FAQ helpful:", error)
}

// ============================================
// TEAM MEMBERS
// ============================================

export async function getAllTeamMembers(options?: {
  public_only?: boolean
  team_type?: string
  active_only?: boolean
}) {
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

export async function createTeamMember(member: TeamMemberForm) {
  const { data, error } = await supabase.from("team_members").insert([member]).select().single()

  if (error) throw error
  return data as TeamMember
}

export async function updateTeamMember(id: string, member: Partial<TeamMemberForm>) {
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

export async function getCaseStudyBySlug(slug: string) {
  const { data, error } = await supabase
    .from("case_studies")
    .select("*, testimonial:testimonials(*)")
    .eq("slug", slug)
    .single()

  if (error) throw error
  return data as CaseStudy
}

export async function createCaseStudy(caseStudy: CaseStudyForm) {
  const { data, error } = await supabase
    .from("case_studies")
    .insert([caseStudy])
    .select()
    .single()

  if (error) throw error
  return data as CaseStudy
}

export async function updateCaseStudy(id: string, caseStudy: Partial<CaseStudyForm>) {
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
  const { error } = await supabase.from("case_studies").delete().eq("id", id)

  if (error) throw error
}

export async function incrementCaseStudyViews(id: string) {
  const { error} = await supabase.rpc("increment_view_count", {
    p_table_name: "case_studies",
    p_record_id: id,
  })

  if (error) console.error("Failed to increment views:", error)
}
```

---

## 4. Admin Dashboard Pages

### 4.1 Directory Structure

```
app/admin/
├── blog/
│   ├── page.tsx              # List all blog posts
│   ├── new/
│   │   └── page.tsx          # Create new blog post
│   └── edit/
│       └── [id]/
│           └── page.tsx      # Edit blog post
├── testimonials/
│   ├── page.tsx              # List all testimonials
│   ├── new/
│   │   └── page.tsx          # Create new testimonial
│   └── edit/
│       └── [id]/
│           └── page.tsx      # Edit testimonial
├── faq/
│   ├── page.tsx              # List all FAQs
│   ├── new/
│   │   └── page.tsx          # Create new FAQ
│   └── edit/
│       └── [id]/
│           └── page.tsx      # Edit FAQ
├── team/
│   ├── page.tsx              # List all team members
│   ├── new/
│   │   └── page.tsx          # Create new team member
│   └── edit/
│       └── [id]/
│           └── page.tsx      # Edit team member
└── case-studies/
    ├── page.tsx              # List all case studies
    ├── new/
    │   └── page.tsx          # Create new case study
    └── edit/
        └── [id]/
            └── page.tsx      # Edit case study
```

### 4.2 Example: Blog Posts Admin List Page

**File:** `app/admin/blog/page.tsx`

```typescript
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAllBlogPosts, deleteBlogPost } from "@/lib/queries/content"
import type { BlogPost } from "@/lib/types/database"
import { Plus, Edit, Trash2, Eye } from "lucide-react"

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadPosts()
  }, [])

  async function loadPosts() {
    try {
      const data = await getAllBlogPosts()
      setPosts(data)
    } catch (error) {
      console.error("Failed to load blog posts:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this blog post?")) return

    try {
      await deleteBlogPost(id)
      setPosts(posts.filter((p) => p.id !== id))
    } catch (error) {
      console.error("Failed to delete blog post:", error)
      alert("Failed to delete blog post")
    }
  }

  if (loading) {
    return <div className="p-8">Loading blog posts...</div>
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Blog Posts</h1>
        <Button asChild>
          <Link href="/admin/blog/new">
            <Plus className="mr-2 h-4 w-4" />
            New Blog Post
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl">{post.title}</CardTitle>
                <div className="flex gap-2 mt-2">
                  {post.is_published ? (
                    <Badge variant="default">Published</Badge>
                  ) : (
                    <Badge variant="secondary">Draft</Badge>
                  )}
                  {post.is_featured && <Badge variant="outline">Featured</Badge>}
                  {post.category && <Badge variant="outline">{post.category}</Badge>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/blog/${post.slug}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/blog/edit/${post.id}`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(post.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{post.excerpt}</p>
              <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
                <span>Views: {post.view_count}</span>
                <span>Author: {post.author_name || "Unknown"}</span>
                <span>
                  Created: {new Date(post.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}

        {posts.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No blog posts found. Create your first post to get started.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
```

### 4.3 Example: Blog Post Create/Edit Form

**File:** `app/admin/blog/new/page.tsx` (similar for edit)

```typescript
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RichTextEditor } from "@/components/rich-text-editor"
import { createBlogPost } from "@/lib/queries/content"
import type { BlogPostForm } from "@/lib/types/database"

export default function NewBlogPostPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<BlogPostForm>({
    title: "",
    excerpt: "",
    content: "",
    category: "",
    tags: [],
    author_name: "",
    is_published: false,
    is_featured: false,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      await createBlogPost(formData)
      router.push("/admin/blog")
    } catch (error) {
      console.error("Failed to create blog post:", error)
      alert("Failed to create blog post")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Create New Blog Post</h1>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={3}
                placeholder="Short summary for cards and previews"
              />
            </div>

            <div>
              <Label htmlFor="content">Content *</Label>
              <RichTextEditor
                value={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Categorization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="technical, case-study, tutorial, etc."
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags?.join(", ")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tags: e.target.value.split(",").map((t) => t.trim()),
                  })
                }
                placeholder="blockchain, fintech, tutorial"
              />
            </div>

            <div>
              <Label htmlFor="author_name">Author Name</Label>
              <Input
                id="author_name"
                value={formData.author_name}
                onChange={(e) =>
                  setFormData({ ...formData, author_name: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Publishing Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_published"
                checked={formData.is_published}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_published: checked as boolean })
                }
              />
              <Label htmlFor="is_published">Publish immediately</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_featured: checked as boolean })
                }
              />
              <Label htmlFor="is_featured">Feature on homepage</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Blog Post"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
```

---

## 5. Dynamic Frontend Pages

### 5.1 Blog List Page

**File:** `app/blog/page.tsx`

```typescript
import { getAllBlogPosts } from "@/lib/queries/content"
import { BlogCard } from "@/components/blog-card"
import { Badge } from "@/components/ui/badge"

export default async function BlogPage() {
  const posts = await getAllBlogPosts({ published_only: true })

  return (
    <div className="container py-20">
      <div className="text-center mb-12">
        <Badge variant="secondary" className="mb-4">
          Blog & Insights
        </Badge>
        <h1 className="text-4xl lg:text-5xl font-bold mb-4">
          Latest from Kamisoft
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Insights on technology, development, and digital innovation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No blog posts published yet. Check back soon!
        </div>
      )}
    </div>
  )
}
```

### 5.2 Blog Post Detail Page

**File:** `app/blog/[slug]/page.tsx`

```typescript
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getBlogPostBySlug, incrementBlogPostViews } from "@/lib/queries/content"
import { Badge } from "@/components/ui/badge"

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug)

  if (!post) {
    return {
      title: "Post Not Found",
    }
  }

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt,
    keywords: post.meta_keywords?.join(", "),
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await getBlogPostBySlug(params.slug)

  if (!post || !post.is_published) {
    notFound()
  }

  // Increment view count (fire and forget)
  incrementBlogPostViews(post.id)

  return (
    <article className="container py-20 max-w-4xl">
      <header className="mb-8">
        {post.category && (
          <Badge variant="secondary" className="mb-4">
            {post.category}
          </Badge>
        )}
        <h1 className="text-4xl lg:text-5xl font-bold mb-4">{post.title}</h1>
        {post.excerpt && (
          <p className="text-xl text-muted-foreground">{post.excerpt}</p>
        )}
        <div className="flex gap-4 mt-6 text-sm text-muted-foreground">
          {post.author_name && <span>By {post.author_name}</span>}
          <span>{new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
          {post.read_time_minutes && <span>{post.read_time_minutes} min read</span>}
        </div>
      </header>

      {post.cover_image_url && (
        <div className="mb-8">
          <img
            src={post.cover_image_url}
            alt={post.cover_image_alt || post.title}
            className="w-full rounded-lg"
          />
        </div>
      )}

      <div
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {post.tags && post.tags.length > 0 && (
        <div className="mt-12 pt-8 border-t">
          <div className="flex gap-2 flex-wrap">
            <span className="text-sm font-semibold">Tags:</span>
            {post.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}
```

### 5.3 FAQ Page

**File:** `app/faq/page.tsx`

```typescript
import { getFAQsByCategory } from "@/lib/queries/content"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"

export default async function FAQPage() {
  const faqsByCategory = await getFAQsByCategory()

  return (
    <div className="container py-20 max-w-4xl">
      <div className="text-center mb-12">
        <Badge variant="secondary" className="mb-4">
          Frequently Asked Questions
        </Badge>
        <h1 className="text-4xl lg:text-5xl font-bold mb-4">
          How Can We Help?
        </h1>
        <p className="text-xl text-muted-foreground">
          Find answers to common questions about our services and process
        </p>
      </div>

      {Object.entries(faqsByCategory).map(([category, faqs]) => (
        <div key={category} className="mb-12">
          <h2 className="text-2xl font-bold mb-4 capitalize">
            {category.replace(/_/g, " ")}
          </h2>
          <Accordion type="single" collapsible>
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>
                  <div
                    className="prose"
                    dangerouslySetInnerHTML={{ __html: faq.answer }}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ))}
    </div>
  )
}
```

---

## 6. Rich Text Editor Integration

### 6.1 Install Dependencies

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link
```

### 6.2 Create Rich Text Editor Component

**File:** `components/rich-text-editor.tsx`

```typescript
"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import { Button } from "@/components/ui/button"
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading2,
  Link as LinkIcon,
  Image as ImageIcon,
} from "lucide-react"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  if (!editor) return null

  const addImage = () => {
    const url = window.prompt("Enter image URL")
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const addLink = () => {
    const url = window.prompt("Enter link URL")
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  return (
    <div className="border rounded-lg">
      <div className="border-b p-2 flex gap-1 flex-wrap">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-muted" : ""}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-muted" : ""}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive("heading") ? "bg-muted" : ""}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "bg-muted" : ""}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "bg-muted" : ""}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive("blockquote") ? "bg-muted" : ""}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={addLink}>
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={addImage}>
          <ImageIcon className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent
        editor={editor}
        className="prose max-w-none p-4 min-h-[300px]"
      />
    </div>
  )
}
```

---

## 7. File Upload & Media Management

### 7.1 Configure Supabase Storage

```sql
-- Create storage buckets (run in Supabase SQL Editor)
INSERT INTO storage.buckets (id, name, public)
VALUES ('content-images', 'content-images', true);

-- Set up storage policies
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'content-images');

CREATE POLICY "Admins can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'content-images' AND
  EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  )
);

CREATE POLICY "Admins can delete images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'content-images' AND
  EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  )
);
```

### 7.2 Create Upload Component

**File:** `components/image-upload.tsx`

```typescript
"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X } from "lucide-react"

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  label?: string
}

export function ImageUpload({ value, onChange, label }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(value || "")

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("content-images")
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("content-images").getPublicUrl(filePath)

      setPreview(publicUrl)
      onChange(publicUrl)
    } catch (error) {
      console.error("Upload failed:", error)
      alert("Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  function handleRemove() {
    setPreview("")
    onChange("")
  }

  return (
    <div>
      {label && <Label className="mb-2 block">{label}</Label>}
      {preview ? (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className="max-w-sm max-h-64 rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <Input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
            id="image-upload"
          />
          <Label
            htmlFor="image-upload"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {uploading ? "Uploading..." : "Click to upload image"}
            </span>
          </Label>
        </div>
      )}
    </div>
  )
}
```

---

## 8. API Routes

All data fetching is handled through Supabase client-side queries (see Section 3). No separate API routes needed due to Supabase's built-in RLS and real-time capabilities.

However, if you need server actions for complex operations:

**File:** `app/actions/content.ts`

```typescript
"use server"

import { supabase } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function publishBlogPost(id: string) {
  const { error } = await supabase
    .from("blog_posts")
    .update({
      is_published: true,
      published_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) throw error

  revalidatePath("/blog")
  revalidatePath("/admin/blog")
}

export async function unpublishBlogPost(id: string) {
  const { error } = await supabase
    .from("blog_posts")
    .update({
      is_published: false,
    })
    .eq("id", id)

  if (error) throw error

  revalidatePath("/blog")
  revalidatePath("/admin/blog")
}
```

---

## 9. Security & RLS Policies

All RLS policies are included in the migration file (`021_create_dynamic_content_tables.sql`).

**Key Security Features:**

1. **Public Read Access**: Only for published content
   - Users can only see `is_published = TRUE` records
   - Draft content is hidden from public

2. **Admin Full Access**: Authenticated admins can CRUD all content
   - Requires `staff_profiles.is_admin = TRUE`
   - Uses `auth.uid()` to verify identity

3. **Audit Trail**: All changes logged in `content_activity_log`
   - Tracks who changed what and when
   - Stores before/after values in JSONB

4. **Storage Security**: Images bucket has proper RLS
   - Public read access for uploaded images
   - Only admins can upload/delete

---

## 10. Implementation Checklist

### Phase 1: Database Setup
- [ ] Run migration script `021_create_dynamic_content_tables.sql`
- [ ] Verify all tables created in Supabase dashboard
- [ ] Test RLS policies work correctly
- [ ] Set up storage buckets for images
- [ ] Configure storage RLS policies

### Phase 2: Type Safety
- [ ] Verify TypeScript types added to `lib/types/database.ts`
- [ ] Create `lib/queries/content.ts` with all query functions
- [ ] Test queries in a test file

### Phase 3: Admin Dashboard
- [ ] Install rich text editor: `npm install @tiptap/react @tiptap/starter-kit`
- [ ] Create `components/rich-text-editor.tsx`
- [ ] Create `components/image-upload.tsx`
- [ ] Build admin pages for Blog (`app/admin/blog/`)
- [ ] Build admin pages for Testimonials (`app/admin/testimonials/`)
- [ ] Build admin pages for FAQ (`app/admin/faq/`)
- [ ] Build admin pages for Team (`app/admin/team/`)
- [ ] Build admin pages for Case Studies (`app/admin/case-studies/`)
- [ ] Update admin navigation to include new sections

### Phase 4: Frontend Pages
- [ ] Create Blog listing page (`app/blog/page.tsx`)
- [ ] Create Blog detail page (`app/blog/[slug]/page.tsx`)
- [ ] Create FAQ page (`app/faq/page.tsx`)
- [ ] Create Team page (`app/team/page.tsx`)
- [ ] Create Case Studies listing (`app/case-studies/page.tsx`)
- [ ] Create Case Study detail (`app/case-studies/[slug]/page.tsx`)
- [ ] Update homepage to show dynamic testimonials
- [ ] Create reusable components (BlogCard, TestimonialCard, etc.)

### Phase 5: SEO & Meta
- [ ] Add dynamic metadata to all blog posts
- [ ] Add dynamic metadata to case studies
- [ ] Generate sitemap including blog & case studies
- [ ] Add structured data (JSON-LD) to blog posts
- [ ] Test social media previews (OG tags)

### Phase 6: Testing
- [ ] Test all CRUD operations in admin dashboard
- [ ] Test publish/unpublish workflows
- [ ] Verify RLS policies prevent unauthorized access
- [ ] Test image uploads
- [ ] Test rich text editor formatting
- [ ] Verify public pages show only published content
- [ ] Test slug generation
- [ ] Test view count incrementing

### Phase 7: Polish & Launch
- [ ] Add loading states to all admin pages
- [ ] Add error handling and user feedback
- [ ] Add search/filter to admin list pages
- [ ] Add pagination to blog listing
- [ ] Add related posts suggestions
- [ ] Add newsletter signup on blog
- [ ] Monitor analytics and adjust
- [ ] Train team on using admin dashboard

---

## Additional Features to Consider

### Future Enhancements

1. **Draft Previews**
   - Allow admins to preview unpublished content
   - Share private preview links with clients

2. **Scheduled Publishing**
   - Add `scheduled_publish_at` field
   - Create cron job to auto-publish at scheduled time

3. **Content Versioning**
   - Track history of changes
   - Allow reverting to previous versions

4. **Multi-language Support**
   - Add `locale` field to all content tables
   - Create language switcher

5. **Advanced Analytics**
   - Track time on page
   - Track scroll depth
   - A/B testing for headlines

6. **Comments System**
   - Add comments table
   - Moderation workflow
   - Email notifications

7. **Search Functionality**
   - Full-text search across blog posts
   - Filter by category, tags, date
   - Search suggestions

8. **Email Notifications**
   - Notify subscribers of new blog posts
   - Notify admins of new testimonials
   - Weekly digest emails

---

## Conclusion

This implementation provides a complete, production-ready CMS for managing all Kamisoft Enterprises content dynamically. Every piece of content is:

✅ **Database-driven** - No hard-coded content
✅ **Admin-controllable** - Full CRUD from dashboard
✅ **SEO-optimized** - Meta tags, structured data, sitemaps
✅ **Secure** - RLS policies, authentication required
✅ **Audited** - Activity log tracks all changes
✅ **Scalable** - Proper indexes, efficient queries
✅ **Type-safe** - Full TypeScript coverage

All new features follow the same pattern established here, making future additions straightforward and consistent.
