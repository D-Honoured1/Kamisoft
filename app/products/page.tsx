import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Calendar, Star } from "lucide-react"
import Link from "next/link"

export default function ProductsPage() {
  // This would normally come from the database
  const products = [
    {
      id: "1",
      name: "Forex Bot",
      description: "Advanced automated trading bot for forex markets with AI-powered analysis and risk management.",
      category: "Fintech",
      features: [
        "AI-powered trading signals",
        "Risk management",
        "Real-time market analysis",
        "24/7 automated trading",
        "Portfolio diversification",
      ],
      pricing_model: "subscription",
      product_url: "https://forexbot.kamisoft.com",
      is_active: true,
      launch_date: "2023-06-15",
      featured_image_url: "/forex-trading-dashboard.png",
    },
    {
      id: "2",
      name: "Brain-Clip",
      description:
        "Revolutionary gaming platform that combines entertainment with cognitive training and skill development.",
      category: "Gaming",
      features: [
        "Cognitive training games",
        "Skill assessment",
        "Progress tracking",
        "Multiplayer challenges",
        "Leaderboards",
      ],
      pricing_model: "free",
      product_url: "https://brainclip.kamisoft.com",
      is_active: true,
      launch_date: "2023-09-20",
      featured_image_url: "/gaming-platform-interface.jpg",
    },
    {
      id: "3",
      name: "E-commerce Platform",
      description:
        "Comprehensive e-commerce solution similar to AliExpress, built for African markets with local payment integration.",
      category: "E-commerce",
      features: [
        "Multi-vendor marketplace",
        "Local payment gateways",
        "Inventory management",
        "Order tracking",
        "Mobile-first design",
      ],
      pricing_model: "custom",
      product_url: "https://marketplace.kamisoft.com",
      is_active: true,
      launch_date: "2024-01-10",
      featured_image_url: "/e-commerce-marketplace.jpg",
    },
    {
      id: "4",
      name: "Enterprise CRM",
      description:
        "Customer relationship management system designed for growing businesses with advanced analytics and automation.",
      category: "Enterprise Software",
      features: ["Contact management", "Sales pipeline", "Email automation", "Analytics dashboard", "Integration APIs"],
      pricing_model: "subscription",
      product_url: "https://crm.kamisoft.com",
      is_active: true,
      launch_date: "2023-11-30",
      featured_image_url: "/crm-dashboard-interface.png",
    },
    {
      id: "5",
      name: "Blockchain Identity",
      description:
        "Decentralized identity verification system using blockchain technology for secure and private authentication.",
      category: "Blockchain",
      features: [
        "Decentralized identity",
        "Biometric verification",
        "Zero-knowledge proofs",
        "Cross-platform compatibility",
        "Privacy-first design",
      ],
      pricing_model: "custom",
      product_url: "https://identity.kamisoft.com",
      is_active: true,
      launch_date: "2024-03-15",
      featured_image_url: "/blockchain-identity.png",
    },
  ]

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

      {/* Products Grid */}
      <section className="py-20">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {products.map((product) => (
              <Card
                key={product.id}
                className="group hover:shadow-lg transition-all duration-300 border-0 bg-card/50 overflow-hidden"
              >
                <div className="aspect-video bg-muted/50 relative overflow-hidden">
                  <img
                    src={product.featured_image_url || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
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
            ))}
          </div>
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
