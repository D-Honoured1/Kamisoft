"use client"
import { useAdminAuth } from "@/components/providers/admin-auth-provider"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RichTextEditor } from "@/components/rich-text-editor"
import { ImageUpload } from "@/components/image-upload"
import { getBlogPostById, updateBlogPost } from "@/lib/queries/content-client"
import type { BlogPost } from "@/lib/types/database"

export default function EditBlogPostPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<BlogPost | null>(null)

  useEffect(() => {
    loadPost()
  }, [])

  async function loadPost() {
    try {
      const post = await getBlogPostById(params.id as string)
      setFormData(post)
    } catch (error) {
      console.error("Failed to load blog post:", error)
      alert("Failed to load blog post")
      router.push("/admin/blog")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData) return

    setSaving(true)

    try {
      await updateBlogPost(params.id as string, formData)
      router.push("/admin/blog")
    } catch (error) {
      console.error("Failed to update blog post:", error)
      alert("Failed to update blog post. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading blog post...</div>
        </div>
      </div>
    )
  }

  if (!formData) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Blog Post Not Found</h2>
          <Button onClick={() => router.push("/admin/blog")}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Blog Post</h1>
        <p className="text-muted-foreground mt-1">Update your article</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
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
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={formData.slug} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground mt-1">
                URL slug is auto-generated and cannot be changed
              </p>
            </div>

            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt || ""}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={3}
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

        <Card>
          <CardHeader>
            <CardTitle>Media</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ImageUpload
              label="Cover Image"
              value={formData.cover_image_url}
              onChange={(url) => setFormData({ ...formData, cover_image_url: url })}
            />
            {formData.cover_image_url && (
              <div>
                <Label htmlFor="cover_image_alt">Image Alt Text</Label>
                <Input
                  id="cover_image_alt"
                  value={formData.cover_image_alt || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, cover_image_alt: e.target.value })
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categorization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category || ""}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags?.join(", ") || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="author_name">Author Name</Label>
              <Input
                id="author_name"
                value={formData.author_name || ""}
                onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="read_time">Estimated Read Time (minutes)</Label>
              <Input
                id="read_time"
                type="number"
                min="1"
                value={formData.read_time_minutes || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    read_time_minutes: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SEO Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="meta_title">Meta Title (60 characters max)</Label>
              <Input
                id="meta_title"
                value={formData.meta_title || ""}
                onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                maxLength={60}
              />
              {formData.meta_title && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.meta_title.length}/60 characters
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="meta_description">Meta Description (160 characters max)</Label>
              <Textarea
                id="meta_description"
                value={formData.meta_description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, meta_description: e.target.value })
                }
                maxLength={160}
                rows={3}
              />
              {formData.meta_description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.meta_description.length}/160 characters
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="meta_keywords">Meta Keywords (comma-separated)</Label>
              <Input
                id="meta_keywords"
                value={formData.meta_keywords?.join(", ") || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    meta_keywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean),
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
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
              <Label htmlFor="is_published" className="cursor-pointer">
                Published
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_featured: checked as boolean })
                }
              />
              <Label htmlFor="is_featured" className="cursor-pointer">
                Featured on homepage
              </Label>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>Created: {new Date(formData.created_at).toLocaleString()}</p>
              <p>Last updated: {new Date(formData.updated_at).toLocaleString()}</p>
              <p>Views: {formData.view_count}</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
