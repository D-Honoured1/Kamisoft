// Update app/page.tsx to hide hero section for logged-in admins
"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PaymentButton } from "@/components/payment-button"
import { ServiceCard } from "@/components/service-card"
import { ArrowRight, Code, Smartphone, Shield, TrendingUp, Users, Award } from "lucide-react"
import { COMPANY_INFO } from "@/lib/constants/services"
import { useAdminAuth } from "@/hooks/use-admin-auth"

export default function HomePage() {
  const { isAuthenticated: isAdminAuthenticated } = useAdminAuth()

  const featuredServices = [
    "full_stack_development",
    "blockchain_solutions", 
    "fintech_platforms",
    "mobile_app_development"
  ] as const

  const stats = [
    { label: "Years of Experience", value: "9+" },
    { label: "Projects Completed", value: "200+" },
    { label: "Happy Clients", value: "150+" },
    { label: "Team Members", value: "16" },
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section - Always show for public homepage */}
      <section className="relative py-20 lg:py-32 bg-gradient-to-br from-background to-muted/50">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="text-sm">
              Established 2015 • A subsidiary of Amor Group
            </Badge>

            <h1 className="text-4xl lg:text-6xl font-bold text-balance">
              From Code to Connectivity—
              <span className="text-primary">We Build It All</span>
            </h1>

            <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
              {COMPANY_INFO.description} Trusted by enterprises, startups, and government organizations across Africa
              and beyond.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/request-service">
                  Hire Us <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <PaymentButton variant="outline" size="lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-20">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold">Our Core Services</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We specialize in cutting-edge technology solutions across multiple domains
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredServices.map((category, index) => (
              <ServiceCard 
                key={category}
                category={category}
                showPaymentButton={true}
                featured={index === 1} // Make blockchain solutions featured
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" size="lg" asChild>
              <Link href="/services">
                View All Services <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold">Why Choose Kamisoft?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We combine technical expertise with business acumen to deliver exceptional results
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Proven Expertise</h3>
              <p className="text-muted-foreground">
                9+ years of experience delivering complex technology solutions across multiple industries
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Dedicated Team</h3>
              <p className="text-muted-foreground">
                16 skilled professionals including developers, designers, and project managers
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Quality Assurance</h3>
              <p className="text-muted-foreground">
                Rigorous testing and quality control processes ensure reliable, secure solutions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold">Ready to Transform Your Business?</h2>
            <p className="text-xl text-muted-foreground">
              Let's discuss how we can help you achieve your technology goals with our comprehensive solutions
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/request-service">
                  Start Your Project <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/portfolio">View Our Work</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}