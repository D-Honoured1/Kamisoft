import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Testimonial } from "@/lib/types/database"
import { Star, CheckCircle } from "lucide-react"

interface TestimonialCardProps {
  testimonial: Testimonial
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start gap-4">
          {testimonial.client_image_url && (
            <img
              src={testimonial.client_image_url}
              alt={testimonial.client_name}
              className="w-12 h-12 rounded-full object-cover"
            />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{testimonial.client_name}</h3>
              {testimonial.is_verified && (
                <CheckCircle className="h-4 w-4 text-primary" title="Verified" />
              )}
            </div>
            {testimonial.client_position && testimonial.client_company && (
              <p className="text-sm text-muted-foreground">
                {testimonial.client_position} at {testimonial.client_company}
              </p>
            )}
            {testimonial.rating && (
              <div className="flex gap-1 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < testimonial.rating!
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm italic mb-4">&ldquo;{testimonial.message}&rdquo;</p>
        {testimonial.project_title && (
          <div className="flex gap-2">
            <Badge variant="outline">{testimonial.project_title}</Badge>
            {testimonial.project_year && (
              <Badge variant="secondary">{testimonial.project_year}</Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
