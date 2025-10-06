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
              Operating since 2015 • Launched online 2025
            </Badge>

            <h1 className="text-4xl lg:text-6xl font-bold text-balance">
              Transform Your Vision Into
              <span className="text-primary"> High-Impact Digital Products</span>
            </h1>

            <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
              From fintech & blockchain to cloud infrastructure, AI automation, CCNA networking & enterprise software — we deliver full-spectrum technology solutions that power growth across Africa and beyond.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/request-service">
                  Get a Free Project Audit <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">
                  Talk to an Expert
                </Link>
              </Button>
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
            <h2 className="text-3xl lg:text-4xl font-bold">What We Build</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From payment systems to blockchain innovation — we engineer digital solutions that drive measurable business results
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
            <h2 className="text-3xl lg:text-4xl font-bold">Why Leading Businesses Partner with Us</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Proven track record + deep domain expertise + transparent execution
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Proven Track Record</h3>
              <p className="text-muted-foreground">
                Over 200 projects delivered across Africa since 2015, serving startups, enterprises, and government organizations
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Code className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Comprehensive Domain Expertise</h3>
              <p className="text-muted-foreground">
                Deep expertise across 8 technology domains: Fintech & Blockchain • Full-Stack & Mobile Development • Cloud & DevOps • AI & Automation • Networking (CCNA) • Technology Consultancy
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Security & Compliance Focused</h3>
              <p className="text-muted-foreground">
                We build with data privacy, encryption, and compliance audits in mind from day one
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Full Lifecycle Partner</h3>
              <p className="text-muted-foreground">
                From concept and architecture to launch, maintenance, and scale — we're with you every step
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Transparent & Agile</h3>
              <p className="text-muted-foreground">
                Weekly demos, clear timelines, and open communication — no surprises, just results
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Smartphone className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Built for African Markets</h3>
              <p className="text-muted-foreground">
                Understanding local payment systems, regulations, and infrastructure challenges unique to Africa
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Case Studies Preview */}
      <section className="py-20">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold">Our Work & Results</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Real projects. Real impact. See how we've helped businesses achieve their goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <Card className="group ">
              <CardHeader>
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg mb-4 flex items-center justify-center">
                  <Shield className="h-16 w-16 text-primary/40" />
                </div>
                <CardTitle>Fintech Payment Gateway</CardTitle>
                <CardDescription>Leading Nigerian Payment Processor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Built a secure, scalable payment gateway handling multi-currency transactions with KYC integration
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Transaction Success Rate</span>
                    <span className="font-semibold text-primary">99.7%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Monthly Processing</span>
                    <span className="font-semibold text-primary">₦500M+</span>
                  </div>
                </div>
                <Button variant="ghost" className="w-full " asChild>
                  <Link href="/case-studies">
                    View Case Study <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="group ">
              <CardHeader>
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg mb-4 flex items-center justify-center">
                  <Code className="h-16 w-16 text-primary/40" />
                </div>
                <CardTitle>Enterprise CRM Platform</CardTitle>
                <CardDescription>Manufacturing & Distribution Company</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Custom CRM solution integrating inventory, sales tracking, and customer management
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Efficiency Gain</span>
                    <span className="font-semibold text-primary">40%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">User Adoption</span>
                    <span className="font-semibold text-primary">95%</span>
                  </div>
                </div>
                <Button variant="ghost" className="w-full " asChild>
                  <Link href="/case-studies">
                    View Case Study <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="group ">
              <CardHeader>
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg mb-4 flex items-center justify-center">
                  <Smartphone className="h-16 w-16 text-primary/40" />
                </div>
                <CardTitle>Mobile Banking App</CardTitle>
                <CardDescription>Digital Bank Launch</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Full-stack mobile banking solution with biometric security and real-time notifications
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Active Users</span>
                    <span className="font-semibold text-primary">50K+</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">App Rating</span>
                    <span className="font-semibold text-primary">4.8/5</span>
                  </div>
                </div>
                <Button variant="ghost" className="w-full " asChild>
                  <Link href="/case-studies">
                    View Case Study <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button size="lg" variant="outline" asChild>
              <Link href="/case-studies">
                View All Case Studies <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold">Ready to Transform Your Business?</h2>
            <p className="text-xl text-muted-foreground">
              Let's discuss your project. We respond within 24 hours with a clear roadmap.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/request-service">
                  Start Your Project <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Schedule a Call</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              ✓ Free consultation · ✓ 24-hour response time · ✓ No obligation
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}