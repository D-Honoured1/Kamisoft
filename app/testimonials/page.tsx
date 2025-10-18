"use client"

import { useEffect, useState } from "react"
import { TestimonialCard } from "@/components/testimonial-card"
import { Badge } from "@/components/ui/badge"
import { InfiniteCarousel } from "@/components/ui/infinite-carousel"

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTestimonials() {
      try {
        const response = await fetch('/api/admin/testimonials')
        if (response.ok) {
          const data = await response.json()
          setTestimonials(data.testimonials?.filter((t: any) => t.is_published) || [])
        }
      } catch (error) {
        console.error('Failed to load testimonials:', error)
      } finally {
        setLoading(false)
      }
    }
    loadTestimonials()
  }, [])

  return (
    <div className="flex flex-col">
      <section className="py-20 lg:py-32 bg-gradient-to-br from-background to-muted/50">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="text-sm">
              Client Testimonials
            </Badge>

            <h1 className="text-4xl lg:text-6xl font-bold text-balance">
              What Our <span className="text-primary">Clients Say</span>
            </h1>

            <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
              Trusted by businesses across Africa and beyond. Read verified testimonials from our
              satisfied clients.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading testimonials...</p>
            </div>
          ) : testimonials.length > 0 ? (
            <InfiniteCarousel>
              {testimonials.map((testimonial) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} />
              ))}
            </InfiniteCarousel>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No testimonials published yet. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
