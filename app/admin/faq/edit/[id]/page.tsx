"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RichTextEditor } from "@/components/rich-text-editor"
import { getFAQById, updateFAQ } from "@/lib/queries/content-client"
import type { FAQForm, FAQCategory } from "@/lib/types/database"

export default function EditFAQPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState<FAQForm>({
    question: "",
    answer: "",
    is_published: false,
    display_order: 0,
  })

  useEffect(() => {
    loadFAQ()
  }, [params.id])

  async function loadFAQ() {
    try {
      const faq = await getFAQById(params.id)
      setFormData({
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        tags: faq.tags,
        related_links: faq.related_links,
        is_published: faq.is_published,
        display_order: faq.display_order,
      })
    } catch (error) {
      console.error("Failed to load FAQ:", error)
      alert("Failed to load FAQ")
      router.push("/admin/faq")
    } finally {
      setLoadingData(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      await updateFAQ(params.id, formData)
      router.push("/admin/faq")
    } catch (error) {
      console.error("Failed to update FAQ:", error)
      alert("Failed to update FAQ. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading FAQ...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit FAQ</h1>
        <p className="text-muted-foreground mt-1">Update frequently asked question</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>FAQ Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="question">Question *</Label>
              <Input
                id="question"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="What is your question?"
                required
              />
            </div>

            <div>
              <Label htmlFor="answer">Answer *</Label>
              <RichTextEditor
                value={formData.answer}
                onChange={(value) => setFormData({ ...formData, answer: value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use rich text formatting for a better answer
              </p>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value: FAQCategory) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="services">Services</SelectItem>
                  <SelectItem value="pricing">Pricing</SelectItem>
                  <SelectItem value="process">Process</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags?.join(", ") || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tags: e.target.value.split(",").map((tag) => tag.trim()),
                  })
                }
                placeholder="pricing, payment, billing"
              />
            </div>

            <div>
              <Label htmlFor="related_links">Related Links (JSON)</Label>
              <Textarea
                id="related_links"
                value={formData.related_links ? JSON.stringify(formData.related_links, null, 2) : ""}
                onChange={(e) => {
                  try {
                    setFormData({
                      ...formData,
                      related_links: e.target.value ? JSON.parse(e.target.value) : undefined,
                    })
                  } catch (err) {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder='[{"title": "Link Title", "url": "https://..."}]'
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Optional: Add related links in JSON format
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Display Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    display_order: e.target.value ? parseInt(e.target.value) : 0,
                  })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">Lower numbers appear first</p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_published"
                checked={formData.is_published}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_published: checked as boolean })
                }
              />
              <Label htmlFor="is_published" className="cursor-pointer">
                Publish immediately
              </Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update FAQ"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
