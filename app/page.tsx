import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ServiceCard } from "@/components/service-card"
import { ArrowRight, Code, Smartphone, Shield, TrendingUp, Users, Award, Star } from "lucide-react"
import { getAllCaseStudies, getAllTestimonials, getAllBlogPosts } from "@/lib/queries/content"

export default async function HomePage() {
  // Fetch real content from database
  const caseStudies = await getAllCaseStudies({ published_only: true, featured_only: true, limit: 3 })
  const testimonials = await getAllTestimonials({ published_only: true, featured_only: true, limit: 3 })
  const blogPosts = await getAllBlogPosts({ published_only: true, limit: 3 })

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

      {/* Case Studies Preview - Real Data */}
      {caseStudies.length > 0 && (
        <section className="py-20">
          <div className="container">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold">Our Work & Results</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Real projects. Real impact. See how we've helped businesses achieve their goals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {caseStudies.map((study) => (
                <Card key={study.id} className="group">
                  <CardHeader>
                    {study.featured_image_url && (
                      <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg mb-4 overflow-hidden">
                        <img src={study.featured_image_url} alt={study.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardTitle>{study.title}</CardTitle>
                    {study.subtitle && <CardDescription>{study.subtitle}</CardDescription>}
                    {study.client_name && !study.is_client_confidential && (
                      <CardDescription>{study.client_name}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {study.challenge && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {study.challenge}
                      </p>
                    )}
                    {study.technologies && study.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {study.technologies.slice(0, 3).map((tech, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">{tech}</Badge>
                        ))}
                      </div>
                    )}
                    <Button variant="ghost" className="w-full" asChild>
                      <Link href={`/case-studies/${study.slug}`}>
                        View Case Study <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
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
      )}

      {/* Testimonials Section */}
      {testimonials.length > 0 && (
        <section className="py-20 bg-muted/30">
          <div className="container">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold">What Our Clients Say</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Don't just take our word for it — hear from businesses we've partnered with
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating || 5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-sm italic mb-4">&ldquo;{testimonial.message}&rdquo;</p>
                    <div className="flex items-center gap-3">
                      {testimonial.client_image_url && (
                        <img
                          src={testimonial.client_image_url}
                          alt={testimonial.client_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <p className="font-semibold">{testimonial.client_name}</p>
                        {testimonial.client_position && testimonial.client_company && (
                          <p className="text-sm text-muted-foreground">
                            {testimonial.client_position} at {testimonial.client_company}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button size="lg" variant="outline" asChild>
                <Link href="/testimonials">
                  View All Testimonials <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Latest Blog Posts */}
      {blogPosts.length > 0 && (
        <section className="py-20">
          <div className="container">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold">Latest Insights</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Expert perspectives on technology, innovation, and business growth
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {blogPosts.map((post) => (
                <Card key={post.id} className="group">
                  <CardHeader>
                    {post.cover_image_url && (
                      <div className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
                        <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex gap-2 mb-2">
                      {post.category && <Badge variant="secondary">{post.category}</Badge>}
                      {post.is_featured && <Badge>Featured</Badge>}
                    </div>
                    <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                    {post.excerpt && <CardDescription className="line-clamp-2">{post.excerpt}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      {post.author_name && <span>By {post.author_name}</span>}
                      {post.read_time_minutes && <span>{post.read_time_minutes} min read</span>}
                    </div>
                    <Button variant="ghost" className="w-full" asChild>
                      <Link href={`/blog/${post.slug}`}>
                        Read More <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button size="lg" variant="outline" asChild>
                <Link href="/blog">
                  View All Articles <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

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