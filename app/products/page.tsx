import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { ExternalLink, Calendar, Star } from "lucide-react"
import Link from "next/link"
import { getAllProducts } from "@/lib/queries/content"
import ProductsCarousel from "./products-carousel"

export default async function ProductsPage() {
  const products = await getAllProducts({ active_only: true })

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
          <ProductsCarousel products={products} getPricingBadge={getPricingBadge} />
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
