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
import { ImageUpload } from "@/components/image-upload"
import { createTeamMember } from "@/lib/queries/content-client"
import type { TeamMemberForm } from "@/lib/types/database"
import { ArrowLeft } from "lucide-react"

export default function NewTeamMemberPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<TeamMemberForm>({
    full_name: "",
    position: "",
    team_type: "staff",
    is_public: true,
    is_featured: false,
    display_order: 0,
    employment_status: "active",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      await createTeamMember(formData)
      router.push("/admin/team")
    } catch (error) {
      console.error("Failed to create team member:", error)
      alert("Failed to create team member. Please try again.")
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
        <h1 className="text-3xl font-bold">Add New Team Member</h1>
        <p className="text-muted-foreground mt-1">Add a new member to your team</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="position">Position *</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Software Engineer, CTO, etc."
                required
              />
            </div>

            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Engineering, Management, etc."
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                placeholder="Brief biography of the team member..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Experience & Skills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="years_of_experience">Years of Experience</Label>
              <Input
                id="years_of_experience"
                type="number"
                min="0"
                max="50"
                value={formData.years_of_experience || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    years_of_experience: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="specializations">Specializations (comma-separated)</Label>
              <Input
                id="specializations"
                value={formData.specializations?.join(", ")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    specializations: e.target.value.split(",").map((s) => s.trim()),
                  })
                }
                placeholder="React, Node.js, DevOps"
              />
            </div>

            <div>
              <Label htmlFor="certifications">Certifications (comma-separated)</Label>
              <Input
                id="certifications"
                value={formData.certifications?.join(", ")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    certifications: e.target.value.split(",").map((c) => c.trim()),
                  })
                }
                placeholder="AWS Certified, CCNA, etc."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/..."
              />
            </div>

            <div>
              <Label htmlFor="github_url">GitHub URL</Label>
              <Input
                id="github_url"
                value={formData.github_url}
                onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                placeholder="https://github.com/..."
              />
            </div>

            <div>
              <Label htmlFor="twitter_url">Twitter/X URL</Label>
              <Input
                id="twitter_url"
                value={formData.twitter_url}
                onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                placeholder="https://twitter.com/..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Image</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload
              label="Profile Photo"
              value={formData.profile_image_url}
              onChange={(url) => setFormData({ ...formData, profile_image_url: url })}
            />
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
                id="is_public"
                checked={formData.is_public}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_public: checked as boolean })
                }
              />
              <Label htmlFor="is_public" className="cursor-pointer">
                Show on public team page
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
                Featured team member
              </Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Team Member"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
