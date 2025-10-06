"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { getAllTestimonials, deleteTestimonial, verifyTestimonial } from "@/lib/queries/content-client"
import type { Testimonial } from "@/lib/types/database"
import { Plus, Edit, Trash2, CheckCircle, Search, Star } from "lucide-react"
import { useAdminAuth } from "@/hooks/use-admin-auth"

export default function AdminTestimonialsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAdminAuth()
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [filteredTestimonials, setFilteredTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login')
    }
  }, [authLoading, isAuthenticated, router])

  if (authLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  if (!user) return null

  useEffect(() => {
    loadTestimonials()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = testimonials.filter(
        (t) =>
          t.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.client_company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.message.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredTestimonials(filtered)
    } else {
      setFilteredTestimonials(testimonials)
    }
  }, [searchTerm, testimonials])

  async function loadTestimonials() {
    try {
      const data = await getAllTestimonials()
      setTestimonials(data)
      setFilteredTestimonials(data)
    } catch (error) {
      console.error("Failed to load testimonials:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete the testimonial from "${name}"?`)) return

    try {
      await deleteTestimonial(id)
      setTestimonials(testimonials.filter((t) => t.id !== id))
    } catch (error) {
      console.error("Failed to delete testimonial:", error)
      alert("Failed to delete testimonial")
    }
  }

  async function handleVerify(id: string) {
    if (!user?.id) {
      alert("You must be logged in to verify testimonials")
      return
    }

    try {
      await verifyTestimonial(id, user.id)
      setTestimonials(
        testimonials.map((t) =>
          t.id === id
            ? { ...t, is_verified: true, verified_at: new Date().toISOString() }
            : t
        )
      )
    } catch (error) {
      console.error("Failed to verify testimonial:", error)
      alert("Failed to verify testimonial")
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading testimonials...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Testimonials</h1>
          <p className="text-muted-foreground mt-1">{testimonials.length} total testimonials</p>
        </div>
        <Button asChild>
          <Link href="/admin/testimonials/new">
            <Plus className="mr-2 h-4 w-4" />
            New Testimonial
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search testimonials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredTestimonials.map((testimonial) => (
          <Card key={testimonial.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">{testimonial.client_name}</CardTitle>
                {testimonial.client_position && testimonial.client_company && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {testimonial.client_position} at {testimonial.client_company}
                  </p>
                )}
                <div className="flex gap-2 flex-wrap">
                  {testimonial.is_published ? (
                    <Badge variant="default">Published</Badge>
                  ) : (
                    <Badge variant="secondary">Draft</Badge>
                  )}
                  {testimonial.is_featured && <Badge variant="outline">Featured</Badge>}
                  {testimonial.is_verified ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Unverified</Badge>
                  )}
                  {testimonial.rating && (
                    <Badge variant="outline">
                      <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                      {testimonial.rating}/5
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {!testimonial.is_verified && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVerify(testimonial.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Verify
                  </Button>
                )}
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/testimonials/edit/${testimonial.id}`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(testimonial.id, testimonial.client_name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm italic mb-3">&ldquo;{testimonial.message}&rdquo;</p>
              <div className="flex gap-4 text-xs text-muted-foreground">
                {testimonial.project_title && <span>Project: {testimonial.project_title}</span>}
                {testimonial.project_year && <span>Year: {testimonial.project_year}</span>}
                <span>Order: {testimonial.display_order}</span>
                <span>Created: {new Date(testimonial.created_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredTestimonials.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {searchTerm
                ? "No testimonials found matching your search."
                : "No testimonials found. Create your first one to get started."}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
