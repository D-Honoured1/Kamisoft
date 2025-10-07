export const dynamic = "force-dynamic"

import { requireAuth } from "@/lib/auth/server-auth"
import { createServerClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DashboardHomeButton } from "@/components/admin-navigation/dashboard-home-button"
import { Plus, Edit, CheckCircle, Star } from "lucide-react"
import { TestimonialActions } from "@/components/admin/testimonial-actions"

export default async function AdminTestimonialsPage() {
  await requireAuth()

  const supabase = createServerClient()

  const { data: testimonials, error } = await supabase
    .from("testimonials")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardHomeButton />

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Testimonials</h1>
          <p className="text-muted-foreground mt-1">{testimonials?.length || 0} total testimonials</p>
        </div>
        <Button asChild>
          <Link href="/admin/testimonials/new">
            <Plus className="mr-2 h-4 w-4" />
            New Testimonial
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {testimonials && testimonials.length > 0 ? testimonials.map((testimonial: any) => (
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
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/testimonials/edit/${testimonial.id}`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
                <TestimonialActions
                  testimonialId={testimonial.id}
                  testimonialName={testimonial.client_name}
                  isVerified={testimonial.is_verified}
                />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm italic mb-3">&ldquo;{testimonial.message}&rdquo;</p>
              <div className="flex gap-4 text-xs text-muted-foreground">
                {testimonial.project_title && <span>Project: {testimonial.project_title}</span>}
                {testimonial.project_year && <span>Year: {testimonial.project_year}</span>}
                <span>Order: {testimonial.display_order || 0}</span>
                <span>Created: {new Date(testimonial.created_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        )) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No testimonials found. Create your first one to get started.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
