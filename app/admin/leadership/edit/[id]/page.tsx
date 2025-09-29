"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { DashboardHomeButton } from "@/components/admin-navigation/dashboard-home-button"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

interface EditLeadershipMemberPageProps {
  params: {
    id: string
  }
}

export default function EditLeadershipMemberPage({ params }: EditLeadershipMemberPageProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notFound, setNotFound] = useState(false)

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

  useEffect(() => {
    fetchMember()
  }, [params.id])

  const fetchMember = async () => {
    try {
      const response = await fetch("/api/admin/leadership")
      if (!response.ok) {
        throw new Error("Failed to fetch leadership team")
      }

      const result = await response.json()
      const member = result.leadership.find((m: any) => m.id === params.id)

      if (!member) {
        setNotFound(true)
        return
      }

      setFormData({
        name: member.name || "",
        position: member.position || "",
        bio: member.bio || "",
        email: member.email || "",
        linkedin_url: member.linkedin_url || "",
        twitter_url: member.twitter_url || "",
        profile_image_url: member.profile_image_url || "",
        display_order: member.display_order || 0,
        is_active: member.is_active ?? true,
      })
    } catch (error) {
      console.error("Error fetching member:", error)
      setNotFound(true)
    } finally {
      setIsLoading(false)
    }
  }

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
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: params.id,
          ...formData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update leadership member")
      }

      router.push("/admin/leadership")
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update leadership member")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <DashboardHomeButton />
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="container mx-auto px-4 py-8">
        <DashboardHomeButton />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Member Not Found</h2>
            <p className="text-muted-foreground mb-4">The leadership member you're looking for doesn't exist.</p>
            <Button asChild>
              <Link href="/admin/leadership">Back to Leadership</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardHomeButton />

      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/leadership">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leadership
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit Leadership Member</h1>
          <p className="text-muted-foreground mt-1">Update the leadership team member details</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Member Information</CardTitle>
          <CardDescription>Update the details for this leadership team member</CardDescription>
        </CardHeader>
        <CardContent>
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitter_url">Twitter URL</Label>
                  <Input
                    id="twitter_url"
                    value={formData.twitter_url}
                    onChange={(e) => handleInputChange("twitter_url", e.target.value)}
                    placeholder="https://twitter.com/username"
                  />
                </div>
              </div>
            </div>

            {/* Profile Image */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Profile Image</h3>

              <div className="space-y-2">
                <Label htmlFor="profile_image_url">Profile Image URL</Label>
                <Input
                  id="profile_image_url"
                  value={formData.profile_image_url}
                  onChange={(e) => handleInputChange("profile_image_url", e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
                {formData.profile_image_url && (
                  <div className="mt-2">
                    <img
                      src={formData.profile_image_url}
                      alt="Profile preview"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Display Settings */}
            <div className="space-y-4">
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
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/leadership">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Updating..." : "Update Member"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}