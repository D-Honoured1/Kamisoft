import { getAllTestimonials } from "@/lib/queries/content"
import { TestimonialCard } from "@/components/testimonial-card"
import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "Client Testimonials | Kamisoft Enterprises",
  description:
    "Read what our clients say about working with Kamisoft Enterprises. Verified testimonials from satisfied customers.",
}

export default async function TestimonialsPage() {
  const testimonials = await getAllTestimonials({ published_only: true })

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
          {testimonials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} />
              ))}
            </div>
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
