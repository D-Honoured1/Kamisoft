"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { ExternalLink, Calendar, Star } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

interface Product {
  id: string
  name: string
  description: string
  category: string
  pricing_model: string
  featured_image_url?: string
  launch_date: string
  features: string[]
  product_url: string
  is_active: boolean
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch("/api/products")
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products || [])
        }
      } catch (error) {
        // Handle error silently
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

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
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-background to-muted/50">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="text-sm">
              Our Products
            </Badge>

            <h1 className="text-4xl lg:text-6xl font-bold text-balance">
              Flagship Products &<span className="text-primary"> Solutions</span>
            </h1>

            <p className="text-xl text-muted-foreground text-balance max-w-3xl mx-auto">
              Discover our suite of innovative products designed to solve real-world problems across fintech, gaming,
              e-commerce, and enterprise software.
            </p>
          </div>
        </div>
      </section>

      {/* Products Carousel */}
      <section className="py-20">
        <div className="container">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products available at the moment.</p>
            </div>
          ) : (
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {products.map((product) => (
                  <CarouselItem key={product.id} className="pl-4 md:basis-1/2 lg:basis-1/2">
                    <Card className="group border-0 bg-card/50 overflow-hidden h-full">
                      <div className="aspect-video bg-muted/50 relative overflow-hidden">
                        {product.featured_image_url ? (
                          <img
                            src={product.featured_image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                            <Star className="h-16 w-16 text-muted-foreground/20" />
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
              <CarouselPrevious className="hidden md:flex -left-12" />
              <CarouselNext className="hidden md:flex -right-12" />
            </Carousel>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold">Need a Custom Solution?</h2>
            <p className="text-xl text-muted-foreground">
              Our products are just the beginning. We can create custom solutions tailored to your specific business
              needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/contact">Discuss Your Project</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/services">View Services</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
