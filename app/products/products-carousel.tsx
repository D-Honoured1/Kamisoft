'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { ExternalLink, Calendar, Star } from "lucide-react"
import Link from "next/link"

interface Product {
  id: string
  name: string
  description: string
  featured_image_url: string | null
  category: string
  pricing_model: string
  launch_date: string
  features: string[]
  product_url: string
}

interface ProductsCarouselProps {
  products: Product[]
}

export default function ProductsCarousel({ products }: ProductsCarouselProps) {
  const getPricingBadge = (pricingModel: string) => {
    switch (pricingModel) {
      case "free":
        return <Badge variant="secondary">Free</Badge>
      case "subscription":
        return <Badge variant="default">Subscription</Badge>
      case "custom":
        return <Badge variant="outline">Custom Pricing</Badge>
      default:
        return <Badge variant="outline">Contact Us</Badge>
    }
  }

  return (
    <Carousel
      opts={{
        align: "start",
        loop: true,
      }}
      className="w-full max-w-7xl mx-auto"
    >
      <CarouselContent className="-ml-2 md:-ml-4">
        {products.map((product) => (
          <CarouselItem key={product.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/2">
            <Card className="group border-0 bg-card/50 overflow-hidden h-full">
              <div className="aspect-video bg-muted/50 relative overflow-hidden">
                {product.featured_image_url ? (
                  <img
                    src={product.featured_image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                    <span className="text-4xl text-muted-foreground">{product.name.charAt(0)}</span>
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <Badge variant="secondary">{product.category}</Badge>
                </div>
                <div className="absolute top-4 right-4">{getPricingBadge(product.pricing_model)}</div>
              </div>

              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-xl">{product.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Launched{" "}
                        {new Date(product.launch_date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                        })}
                      </span>
                    </div>
                  </div>
                  <Star className="h-5 w-5 text-primary" />
                </div>
                <CardDescription className="text-sm leading-relaxed">{product.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                    Key Features
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {product.features.slice(0, 3).map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {product.features.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{product.features.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button size="sm" asChild>
                    <Link href={product.product_url} target="_blank" rel="noopener noreferrer">
                      Visit Product <ExternalLink className="ml-2 h-3 w-3" />
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/contact">Learn More</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}
