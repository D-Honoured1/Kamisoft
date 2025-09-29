"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { DashboardHomeButton } from "@/components/admin-navigation/dashboard-home-button"
import { ImageUpload } from "@/components/ui/image-upload"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

export default function NewLeadershipMemberPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    position: "",
    bio: "",
    email: "",
    linkedin_url: "",
    twitter_url: "",
    profile_image_url: "",
    display_order: 0,
    is_active: true,
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/admin/leadership", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create leadership member")
      }

      router.push("/admin/leadership")
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create leadership member")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <DashboardHomeButton />

      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/leadership">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leadership
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Add Leadership Member</h1>
          <p className="text-muted-foreground mt-1">Create a new leadership team member</p>
        </div>
      </div>

      <Card className="w-full border-2 shadow-lg">
        <CardHeader className="border-b bg-muted/50">
          <CardTitle>Member Information</CardTitle>
          <CardDescription>Fill in the details for the new leadership team member</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Full name"
                  required
                  className="border-2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position *</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => handleInputChange("position", e.target.value)}
                  placeholder="e.g., Chief Executive Officer"
                  required
                  className="border-2"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                placeholder="Brief biography and background"
                rows={4}
                className="border-2"
              />
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contact Information</h3>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="email@example.com"
                  className="border-2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                  <Input
                    id="linkedin_url"
                    value={formData.linkedin_url}
                    onChange={(e) => handleInputChange("linkedin_url", e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="border-2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitter_url">Twitter URL</Label>
                  <Input
                    id="twitter_url"
                    value={formData.twitter_url}
                    onChange={(e) => handleInputChange("twitter_url", e.target.value)}
                    placeholder="https://twitter.com/username"
                    className="border-2"
                  />
                </div>
              </div>
            </div>

            {/* Profile Image */}
            <div className="space-y-4 p-4 border-2 border-dashed rounded-lg">
              <h3 className="text-lg font-medium">Profile Image</h3>

              <ImageUpload
                value={formData.profile_image_url}
                onImageUpload={(url) => handleInputChange("profile_image_url", url)}
                onImageRemove={() => handleInputChange("profile_image_url", "")}
                label="Profile Image"
                bucket="leadership-images"
                maxSize={5}
              />

              <div className="space-y-2">
                <Label htmlFor="profile_image_url">Or enter image URL manually</Label>
                <Input
                  id="profile_image_url"
                  value={formData.profile_image_url}
                  onChange={(e) => handleInputChange("profile_image_url", e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="border-2"
                />
              </div>
            </div>

            {/* Display Settings */}
            <div className="space-y-4 p-4 border-2 border-dashed rounded-lg">
              <h3 className="text-lg font-medium">Display Settings</h3>

              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => handleInputChange("display_order", parseInt(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  className="border-2"
                />
                <p className="text-sm text-muted-foreground">Lower numbers appear first</p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                />
                <Label htmlFor="is_active">Active (visible on website)</Label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6 border-t-2">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Creating..." : "Create Member"}
              </Button>
              <Button type="button" variant="outline" asChild className="border-2">
                <Link href="/admin/leadership">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}