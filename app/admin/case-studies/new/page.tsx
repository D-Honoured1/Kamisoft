"use client"

import { useState } from "react"
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
import { ImageUpload } from "@/components/image-upload"
import { createCaseStudy } from "@/lib/queries/content-client"
import type { CaseStudyForm, ServiceCategory } from "@/lib/types/database"
import { ArrowLeft } from "lucide-react"

export default function NewCaseStudyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CaseStudyForm>({
    title: "",
    description: "",
    content: "",
    is_published: false,
    is_featured: false,
    display_order: 0,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      await createCaseStudy(formData)
      router.push("/admin/case-studies")
    } catch (error: any) {
      console.error("Failed to create case study:", error)
      alert(`Failed to create case study: ${error.message || JSON.stringify(error)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Add New Case Study</h1>
        <p className="text-muted-foreground mt-1">Showcase your successful project</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Short Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Brief overview of the project..."
                required
              />
            </div>

            <div>
              <Label htmlFor="content">Full Content *</Label>
              <RichTextEditor
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Detailed project description, challenges, and solutions
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client & Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="client_name">Client Name</Label>
              <Input
                id="client_name"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="Fintech, E-commerce, Healthcare, etc."
              />
            </div>

            <div>
              <Label htmlFor="service_category">Service Category</Label>
              <Select
                value={formData.service_category}
                onValueChange={(value: ServiceCategory) =>
                  setFormData({ ...formData, service_category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_stack_development">Full Stack Development</SelectItem>
                  <SelectItem value="mobile_app_development">Mobile App Development</SelectItem>
                  <SelectItem value="blockchain_solutions">Blockchain Solutions</SelectItem>
                  <SelectItem value="fintech_platforms">Fintech Platforms</SelectItem>
                  <SelectItem value="networking_ccna">Networking & CCNA</SelectItem>
                  <SelectItem value="consultancy">Consultancy</SelectItem>
                  <SelectItem value="cloud_devops">Cloud & DevOps</SelectItem>
                  <SelectItem value="ai_automation">AI & Automation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="project_duration">Project Duration</Label>
              <Input
                id="project_duration"
                value={formData.project_duration}
                onChange={(e) => setFormData({ ...formData, project_duration: e.target.value })}
                placeholder="3 months, 6 weeks, etc."
              />
            </div>

            <div>
              <Label htmlFor="team_size">Team Size</Label>
              <Input
                id="team_size"
                type="number"
                min="1"
                value={formData.team_size || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    team_size: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="completion_date">Completion Date</Label>
              <Input
                id="completion_date"
                type="date"
                value={formData.completion_date}
                onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Technical Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="technologies">Technologies (comma-separated)</Label>
              <Input
                id="technologies"
                value={formData.technologies?.join(", ")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    technologies: e.target.value.split(",").map((t) => t.trim()),
                  })
                }
                placeholder="React, Node.js, PostgreSQL, AWS"
              />
            </div>

            <div>
              <Label htmlFor="challenge">Challenge</Label>
              <Textarea
                id="challenge"
                value={formData.challenge}
                onChange={(e) => setFormData({ ...formData, challenge: e.target.value })}
                rows={3}
                placeholder="What was the main challenge?"
              />
            </div>

            <div>
              <Label htmlFor="solution">Solution</Label>
              <Textarea
                id="solution"
                value={formData.solution}
                onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                rows={3}
                placeholder="How did you solve it?"
              />
            </div>

            <div>
              <Label htmlFor="results">Results & Impact</Label>
              <Textarea
                id="results"
                value={formData.results}
                onChange={(e) => setFormData({ ...formData, results: e.target.value })}
                rows={3}
                placeholder="What were the outcomes and impact?"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Media & Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ImageUpload
              label="Cover Image"
              value={formData.cover_image_url}
              onChange={(url) => setFormData({ ...formData, cover_image_url: url })}
            />

            <div>
              <Label htmlFor="live_url">Live Project URL</Label>
              <Input
                id="live_url"
                value={formData.live_url}
                onChange={(e) => setFormData({ ...formData, live_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="github_url">GitHub Repository URL</Label>
              <Input
                id="github_url"
                value={formData.github_url}
                onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                placeholder="https://github.com/..."
              />
            </div>

            <div>
              <Label htmlFor="gallery_images">Gallery Images (JSON array of URLs)</Label>
              <Textarea
                id="gallery_images"
                value={formData.gallery_images ? JSON.stringify(formData.gallery_images, null, 2) : ""}
                onChange={(e) => {
                  try {
                    setFormData({
                      ...formData,
                      gallery_images: e.target.value ? JSON.parse(e.target.value) : undefined,
                    })
                  } catch (err) {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder='["https://...", "https://..."]'
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Optional: Add image URLs in JSON array format
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SEO & Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="meta_title">Meta Title</Label>
              <Input
                id="meta_title"
                value={formData.meta_title}
                onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                placeholder="SEO title for search engines"
              />
            </div>

            <div>
              <Label htmlFor="meta_description">Meta Description</Label>
              <Textarea
                id="meta_description"
                value={formData.meta_description}
                onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                rows={2}
                placeholder="SEO description for search engines"
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
                placeholder="web development, fintech, blockchain"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metrics (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="metrics">Project Metrics (JSON)</Label>
              <Textarea
                id="metrics"
                value={formData.metrics ? JSON.stringify(formData.metrics, null, 2) : ""}
                onChange={(e) => {
                  try {
                    setFormData({
                      ...formData,
                      metrics: e.target.value ? JSON.parse(e.target.value) : undefined,
                    })
                  } catch (err) {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder='{"users": "10k+", "uptime": "99.9%", "performance": "50% faster"}'
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Add key metrics in JSON format
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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_featured: checked as boolean })
                }
              />
              <Label htmlFor="is_featured" className="cursor-pointer">
                Feature on homepage
              </Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Case Study"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
