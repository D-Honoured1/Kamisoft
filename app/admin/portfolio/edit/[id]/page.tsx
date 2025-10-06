// app/admin/portfolio/edit/[id]/page.tsx
import { useAdminAuth } from "@/components/providers/admin-auth-provider"
"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ImageUpload } from "@/components/ui/image-upload"
import { PortfolioImageManager } from "@/components/admin/portfolio-image-manager"
import { ArrowLeft, Plus, X, Loader2 } from "lucide-react"
import Link from "next/link"

const SERVICE_CATEGORIES = [
  { value: "full_stack_development", label: "Full-Stack Development" },
  { value: "mobile_app_development", label: "Mobile App Development" },
  { value: "blockchain_solutions", label: "Blockchain Solutions" },
  { value: "fintech_platforms", label: "Fintech Platforms" },
  { value: "networking_ccna", label: "Networking & CCNA" },
  { value: "consultancy", label: "Consultancy Services" },
  { value: "cloud_devops", label: "Cloud & DevOps" },
  { value: "ai_automation", label: "AI & Automation" },
]

export default function EditPortfolioProject() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState("")
  const [technologies, setTechnologies] = useState<string[]>([])
  const [newTechnology, setNewTechnology] = useState("")

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    service_category: "",
    client_name: "",
    project_url: "",
    github_url: "",
    featured_image_url: "",
    completion_date: "",
    is_featured: false,
    is_published: true,
    client_feedback: "",
    client_rating: 0,
    feedback_date: "",
  })

  // Load existing project data
  useEffect(() => {
    const loadProject = async () => {
      try {
        const response = await fetch(`/api/admin/portfolio?id=${projectId}`)
        if (!response.ok) {
          throw new Error("Failed to load project")
        }
        const data = await response.json()
        const project = data.project

        setFormData({
          title: project.title || "",
          description: project.description || "",
          service_category: project.service_category || "",
          client_name: project.client_name || "",
          project_url: project.project_url || "",
          github_url: project.github_url || "",
          featured_image_url: project.featured_image_url || "",
          completion_date: project.completion_date ? project.completion_date.split('T')[0] : "",
          is_featured: project.is_featured || false,
          is_published: project.is_published !== undefined ? project.is_published : true,
          client_feedback: project.client_feedback || "",
          client_rating: project.client_rating || 0,
          feedback_date: project.feedback_date ? project.feedback_date.split('T')[0] : "",
        })
        setTechnologies(project.technologies || [])
      } catch (error: any) {
        console.error("Error loading project:", error)
        setError("Failed to load project data")
      } finally {
        setIsLoadingData(false)
      }
    }

    if (projectId) {
      loadProject()
    }
  }, [projectId])

  const addTechnology = () => {
    if (newTechnology.trim() && !technologies.includes(newTechnology.trim())) {
      setTechnologies([...technologies, newTechnology.trim()])
      setNewTechnology("")
    }
  }

  const removeTechnology = (tech: string) => {
    setTechnologies(technologies.filter(t => t !== tech))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/admin/portfolio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: projectId,
          ...formData,
          technologies,
          completion_date: formData.completion_date || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update project")
      }

      router.push("/admin/portfolio")
    } catch (error: any) {
      console.error("Error updating project:", error)
      setError(error.message || "An error occurred while updating the project")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading project data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/portfolio">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Portfolio
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit Portfolio Project</h1>
          <p className="text-muted-foreground mt-1">Update your portfolio project information</p>
        </div>
      </div>

      <Card className="border-2 shadow-lg">
        <CardHeader className="border-b bg-muted/50">
          <CardTitle>Project Details</CardTitle>
          <CardDescription>Update the information about your portfolio project</CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-2">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter project title"
                  required
                  className="border-2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_category">Service Category *</Label>
                <Select
                  value={formData.service_category}
                  onValueChange={(value) => setFormData({ ...formData, service_category: value })}
                  required
                >
                  <SelectTrigger className="border-2">
                    <SelectValue placeholder="Select a service category" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Project Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the project, its features, and what makes it special"
                rows={4}
                required
                className="border-2"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="client_name">Client Name</Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  placeholder="Enter client name (optional)"
                  className="border-2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="completion_date">Completion Date</Label>
                <Input
                  id="completion_date"
                  type="date"
                  value={formData.completion_date}
                  onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
                  className="border-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="project_url">Project URL</Label>
                <Input
                  id="project_url"
                  type="url"
                  value={formData.project_url}
                  onChange={(e) => setFormData({ ...formData, project_url: e.target.value })}
                  placeholder="https://example.com"
                  className="border-2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="github_url">GitHub URL</Label>
                <Input
                  id="github_url"
                  type="url"
                  value={formData.github_url}
                  onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                  placeholder="https://github.com/username/repo"
                  className="border-2"
                />
              </div>
            </div>

            <PortfolioImageManager
              projectId={projectId}
              projectTitle={formData.title}
              projectUrl={formData.project_url}
              currentImageUrl={formData.featured_image_url}
              onImageUpdate={(url) => setFormData({ ...formData, featured_image_url: url })}
            />

            <div className="space-y-4">
              <Label>Technologies Used</Label>
              <div className="flex gap-2">
                <Input
                  value={newTechnology}
                  onChange={(e) => setNewTechnology(e.target.value)}
                  placeholder="Add a technology (e.g., React, Node.js)"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTechnology())}
                  className="border-2"
                />
                <Button type="button" onClick={addTechnology} variant="outline" className="border-2">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {technologies.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 border-2 border-dashed rounded-md">
                  {technologies.map((tech, index) => (
                    <div key={index} className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-sm border">
                      <span>{tech}</span>
                      <button
                        type="button"
                        onClick={() => removeTechnology(tech)}
                        className="hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Client Feedback Section */}
            <div className="space-y-4 p-4 border-2 border-dashed rounded-lg">
              <Label>Client Feedback (Optional)</Label>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client_feedback">Client Testimonial</Label>
                  <Textarea
                    id="client_feedback"
                    value={formData.client_feedback}
                    onChange={(e) => setFormData({ ...formData, client_feedback: e.target.value })}
                    placeholder="Enter client feedback or testimonial..."
                    rows={3}
                    className="border-2"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client_rating">Client Rating (1-5 stars)</Label>
                    <Select
                      value={formData.client_rating.toString()}
                      onValueChange={(value) => setFormData({ ...formData, client_rating: parseInt(value) })}
                    >
                      <SelectTrigger className="border-2">
                        <SelectValue placeholder="Select rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">No Rating</SelectItem>
                        <SelectItem value="1">⭐ 1 Star</SelectItem>
                        <SelectItem value="2">⭐⭐ 2 Stars</SelectItem>
                        <SelectItem value="3">⭐⭐⭐ 3 Stars</SelectItem>
                        <SelectItem value="4">⭐⭐⭐⭐ 4 Stars</SelectItem>
                        <SelectItem value="5">⭐⭐⭐⭐⭐ 5 Stars</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feedback_date">Feedback Date</Label>
                    <Input
                      id="feedback_date"
                      type="date"
                      value={formData.feedback_date}
                      onChange={(e) => setFormData({ ...formData, feedback_date: e.target.value })}
                      className="border-2"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-4 border-2 border-dashed rounded-lg">
              <Label>Project Settings</Label>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked as boolean })}
                />
                <Label htmlFor="is_featured" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Feature this project (will be highlighted on the portfolio page)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked as boolean })}
                />
                <Label htmlFor="is_published" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Publish this project (make it visible on the public portfolio)
                </Label>
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t-2">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Updating Project..." : "Update Project"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} className="border-2">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}