# Quick Start Guide - Dynamic Content Management

## TL;DR - Get Started in 5 Steps

This guide gets your dynamic content system up and running quickly. For detailed documentation, see `DYNAMIC_CONTENT_IMPLEMENTATION_GUIDE.md`.

---

## Prerequisites

- [x] Supabase account with project set up
- [x] Next.js project running (existing Kamisoft app)
- [x] Admin authentication working
- [x] PostgreSQL access to your Supabase database

---

## Step 1: Run Database Migration (5 minutes)

### Option A: Via Supabase Dashboard (Easiest)

1. Open Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy entire contents of `/scripts/021_create_dynamic_content_tables.sql`
4. Paste into editor
5. Click "Run"
6. Verify success - should see "Success. No rows returned"

### Option B: Via Supabase CLI

```bash
# If you have Supabase CLI installed
cd /home/vboxuser/TOP/kamisoft-app
supabase db push
```

### Verify Migration

Check that new tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'blog_posts',
  'testimonials',
  'faqs',
  'team_members',
  'case_studies',
  'content_activity_log'
);
```

Should return 6 rows.

---

## Step 2: Install Dependencies (2 minutes)

```bash
cd /home/vboxuser/TOP/kamisoft-app

# Rich text editor
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link

# Optional: If you want markdown support instead
# npm install react-markdown remark-gfm
```

---

## Step 3: Create Query Functions (10 minutes)

Create a new file for content queries:

```bash
mkdir -p lib/queries
touch lib/queries/content.ts
```

Copy the complete query functions from `DYNAMIC_CONTENT_IMPLEMENTATION_GUIDE.md` Section 3 into this file.

**Quick test:**

```typescript
// Test in a page component
import { getAllBlogPosts } from "@/lib/queries/content"

export default async function TestPage() {
  const posts = await getAllBlogPosts()
  return <pre>{JSON.stringify(posts, null, 2)}</pre>
}
```

---

## Step 4: Set Up Storage Buckets (5 minutes)

### Via Supabase Dashboard

1. Go to **Storage** → **Create Bucket**
2. Create bucket: `content-images`
3. Check "Public bucket"
4. Click "Create"

### Set Storage Policies

Go to **Storage** → **Policies** → **New Policy**

```sql
-- Policy 1: Public can view images
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
USING (bucket_id = 'content-images');

-- Policy 2: Admins can upload images
CREATE POLICY "Admins can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'content-images' AND
  auth.role() = 'authenticated'
);

-- Policy 3: Admins can delete images
CREATE POLICY "Admins can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'content-images' AND
  auth.role() = 'authenticated'
);
```

---

## Step 5: Create Your First Admin Page (30 minutes)

Let's build the Blog admin page as your first example.

### 5a. Create Directory Structure

```bash
mkdir -p app/admin/blog/new
mkdir -p app/admin/blog/edit/[id]
```

### 5b. Create Blog List Page

**File:** `app/admin/blog/page.tsx`

```typescript
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getAllBlogPosts } from "@/lib/queries/content"
import type { BlogPost } from "@/lib/types/database"
import { Plus } from "lucide-react"

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPosts()
  }, [])

  async function loadPosts() {
    try {
      const data = await getAllBlogPosts()
      setPosts(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Blog Posts</h1>
        <Button asChild>
          <Link href="/admin/blog/new">
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="border p-4 rounded-lg">
            <h3 className="font-bold">{post.title}</h3>
            <p className="text-sm text-muted-foreground">{post.excerpt}</p>
            <div className="mt-2 flex gap-2">
              <Link href={`/admin/blog/edit/${post.id}`}>
                <Button size="sm">Edit</Button>
              </Link>
              <Link href={`/blog/${post.slug}`}>
                <Button size="sm" variant="outline">
                  View
                </Button>
              </Link>
            </div>
          </div>
        ))}

        {posts.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            No blog posts yet. Create your first one!
          </p>
        )}
      </div>
    </div>
  )
}
```

### 5c. Create New Post Form

**File:** `app/admin/blog/new/page.tsx`

```typescript
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { createBlogPost } from "@/lib/queries/content"
import type { BlogPostForm } from "@/lib/types/database"

export default function NewBlogPostPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<BlogPostForm>({
    title: "",
    excerpt: "",
    content: "",
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
      console.error(error)
      alert("Failed to create blog post")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Create New Blog Post</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
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
          />
        </div>

        <div>
          <Label htmlFor="content">Content *</Label>
          <Textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={10}
            required
          />
        </div>

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

### 5d. Test It!

1. Navigate to `/admin/blog`
2. Click "New Post"
3. Fill in the form
4. Click "Create Blog Post"
5. Verify post appears in list

---

## Step 6: Create Public Blog Page (15 minutes)

### 6a. Create Blog List Page

**File:** `app/blog/page.tsx`

```typescript
import { getAllBlogPosts } from "@/lib/queries/content"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default async function BlogPage() {
  const posts = await getAllBlogPosts({ published_only: true })

  return (
    <div className="container py-20">
      <h1 className="text-4xl font-bold mb-12 text-center">Blog</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`}>
            <div className="border rounded-lg p-6 hover:shadow-lg transition">
              {post.cover_image_url && (
                <img
                  src={post.cover_image_url}
                  alt={post.title}
                  className="w-full h-48 object-cover rounded mb-4"
                />
              )}
              <h2 className="text-xl font-bold mb-2">{post.title}</h2>
              <p className="text-sm text-muted-foreground mb-4">{post.excerpt}</p>
              {post.category && <Badge variant="secondary">{post.category}</Badge>}
            </div>
          </Link>
        ))}
      </div>

      {posts.length === 0 && (
        <p className="text-center text-muted-foreground">
          No blog posts published yet.
        </p>
      )}
    </div>
  )
}
```

### 6b. Create Blog Post Detail Page

**File:** `app/blog/[slug]/page.tsx`

```typescript
import { notFound } from "next/navigation"
import { getBlogPostBySlug } from "@/lib/queries/content"

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string }
}) {
  const post = await getBlogPostBySlug(params.slug)

  if (!post || !post.is_published) {
    notFound()
  }

  return (
    <article className="container py-20 max-w-4xl">
      <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

      {post.excerpt && (
        <p className="text-xl text-muted-foreground mb-8">{post.excerpt}</p>
      )}

      {post.cover_image_url && (
        <img
          src={post.cover_image_url}
          alt={post.title}
          className="w-full rounded-lg mb-8"
        />
      )}

      <div
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <div className="mt-8 pt-8 border-t text-sm text-muted-foreground">
        Published on {new Date(post.published_at || post.created_at).toLocaleDateString()}
      </div>
    </article>
  )
}
```

### 6c. Test Public Pages

1. Navigate to `/blog`
2. Should see your published post
3. Click on it to view full post
4. Verify SEO meta tags in page source

---

## Step 7: Add to Admin Navigation (5 minutes)

Find your admin layout/navigation component and add:

```tsx
<Link href="/admin/blog">
  <Button variant="ghost">Blog</Button>
</Link>
```

---

## What's Next?

You now have a fully functional dynamic blog system! To add more content types:

### Repeat for Other Content Types

1. **Testimonials** - Follow same pattern as blog
2. **FAQ** - Follow same pattern as blog
3. **Team Members** - Follow same pattern as blog
4. **Case Studies** - Follow same pattern as blog

### Enhance Your Blog

1. Add rich text editor (see implementation guide)
2. Add image upload component
3. Add SEO meta tags
4. Add category filtering
5. Add search functionality

---

## Troubleshooting

### Common Issues

**Issue: "relation blog_posts does not exist"**
- Solution: Run the migration script again

**Issue: "RLS policy violation"**
- Solution: Make sure you're logged in as admin with `is_admin = true`

**Issue: "Cannot read properties of undefined (reading 'map')"**
- Solution: Add null check: `{posts?.map(...)} `

**Issue: Images won't upload**
- Solution: Check storage bucket exists and policies are set

---

## Next Steps

1. ✅ **Complete this quick start**
2. 📖 Read `DYNAMIC_CONTENT_IMPLEMENTATION_GUIDE.md` for advanced features
3. 🏗️ Review `ARCHITECTURE_OVERVIEW.md` to understand the system
4. 📝 Read `WEBSITE_CONTENT_STRATEGY.md` for content guidelines
5. 🚀 Build remaining admin pages (Testimonials, FAQ, etc.)
6. 🎨 Add rich text editor and image uploads
7. 🔍 Implement SEO optimization
8. 📊 Add analytics tracking

---

## Support

If you encounter issues:

1. Check the error message in browser console
2. Check Supabase logs in dashboard
3. Review the implementation guide
4. Check database connection
5. Verify RLS policies are working

---

## Resources

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **TipTap Editor**: https://tiptap.dev/introduction
- **Your Implementation Guide**: `DYNAMIC_CONTENT_IMPLEMENTATION_GUIDE.md`

---

**Estimated Time**: ~1-2 hours to complete this quick start
**Difficulty**: Intermediate
**Prerequisites**: Basic React/Next.js knowledge

Good luck! 🚀
