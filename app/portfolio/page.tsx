// app/portfolio/page.tsx - DYNAMIC VERSION
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Github, Calendar, Star } from "lucide-react"
import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"

export default async function PortfolioPage() {
  // Fetch projects from database
  const supabase = createServerClient()
  
  const { data: portfolioProjects, error } = await supabase
    .from("portfolio_projects")
    .select("*")
    .eq("is_published", true) // Only show published projects
    .order("created_at", { ascending: false })

  // Fallback to empty array if error or no data
  const projects = portfolioProjects || []

  const getCategoryBadge = (category: string) => {
    const categoryMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      fintech_platforms: { label: "Fintech", variant: "default" },
      full_stack_development: { label: "Full-Stack", variant: "secondary" },
      blockchain_solutions: { label: "Blockchain", variant: "outline" },
      ai_automation: { label: "AI/IoT", variant: "default" },
      mobile_app_development: { label: "Mobile", variant: "secondary" },
      cloud_devops: { label: "Cloud", variant: "outline" },
      networking_ccna: { label: "Networking", variant: "default" },
      consultancy: { label: "Consulting", variant: "secondary" },
    }

    const config = categoryMap[category] || { label: category, variant: "outline" as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const featuredProjects = projects.filter((p) => p.is_featured)
  const otherProjects = projects.filter((p) => !p.is_featured)

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-background to-muted/50">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="text-sm">
              Our Portfolio
            </Badge>

            <h1 className="text-4xl lg:text-6xl font-bold text-balance">
              Successful Projects &<span className="text-primary"> Case Studies</span>
            </h1>

            <p className="text-xl text-muted-foreground text-balance max-w-3xl mx-auto">
              Explore our portfolio of successful projects across fintech, blockchain, enterprise software, and more.
              Each project represents our commitment to excellence and innovation.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      {featuredProjects.length > 0 && (
        <section className="py-20">
          <div className="container">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold">Featured Projects</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Our most impactful and innovative solutions
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredProjects.map((project) => (
                <Card
                  key={project.id}
                  className="group hover:shadow-lg transition-all duration-300 border-0 bg-card/50 overflow-hidden"
                >
                  <div className="aspect-video bg-muted/50 relative overflow-hidden">
                    <img
                      src={project.featured_image_url || "/placeholder.svg"}
                      alt={project.title}
                      className="w-full h-full object-cover "
                    />
                    <div className="absolute top-4 left-4">{getCategoryBadge(project.service_category)}</div>
                    <div className="absolute top-4 right-4">
                      <Star className="h-5 w-5 text-primary" />
                    </div>
                  </div>

                  <CardHeader>
                    <div className="space-y-2">
                      <CardTitle className="text-xl">{project.title}</CardTitle>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span className="font-medium">{project.client_name || 'Confidential Client'}</span>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {project.completion_date 
                              ? new Date(project.completion_date).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                })
                              : "In Progress"
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="text-sm leading-relaxed">{project.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                        Technologies Used
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {project.technologies?.slice(0, 4).map((tech, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tech}
                          </Badge>
                        )) || []}
                        {project.technologies && project.technologies.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{project.technologies.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Client Feedback Display */}
                    {project.client_feedback && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Client Feedback</p>
                        <p className="text-sm italic">"{project.client_feedback}"</p>
                        {project.client_rating && project.client_rating > 0 && (
                          <div className="flex items-center mt-2">
                            <span className="text-xs text-muted-foreground mr-1">Rating:</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < project.client_rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      {project.project_url && (
                        <Button size="sm" asChild>
                          <Link href={project.project_url} target="_blank" rel="noopener noreferrer">
                            View Project <ExternalLink className="ml-2 h-3 w-3" />
                          </Link>
                        </Button>
                      )}
                      {project.github_url && (
                        <Button size="sm" variant="outline" asChild>
                          <Link href={project.github_url} target="_blank" rel="noopener noreferrer">
                            <Github className="mr-2 h-3 w-3" /> Code
                          </Link>
                        </Button>
                      )}
                      {!project.project_url && !project.github_url && (
                        <Button size="sm" variant="outline" asChild>
                          <Link href="/contact">Learn More</Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Other Projects */}
      {otherProjects.length > 0 && (
        <section className={`py-20 ${featuredProjects.length > 0 ? 'bg-muted/30' : ''}`}>
          <div className="container">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold">
                {featuredProjects.length > 0 ? 'More Projects' : 'Our Projects'}
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {featuredProjects.length > 0 
                  ? 'Additional successful implementations across various industries'
                  : 'Successful implementations across various industries'
                }
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherProjects.map((project) => (
                <Card
                  key={project.id}
                  className="group hover:shadow-lg transition-all duration-300 border-0 bg-background/50"
                >
                  <div className="aspect-video bg-muted/50 relative overflow-hidden">
                    <img
                      src={project.featured_image_url || "/placeholder.svg"}
                      alt={project.title}
                      className="w-full h-full object-cover "
                    />
                    <div className="absolute top-3 left-3">{getCategoryBadge(project.service_category)}</div>
                  </div>

                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="font-medium">{project.client_name || 'Confidential'}</span>
                      <span>
                        {project.completion_date 
                          ? new Date(project.completion_date).getFullYear()
                          : 'Ongoing'
                        }
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <CardDescription className="text-sm leading-relaxed mb-4">{project.description}</CardDescription>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {project.technologies?.slice(0, 3).map((tech, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      )) || []}
                    </div>

                    <div className="flex gap-2">
                      {project.project_url && (
                        <Button size="sm" variant="outline" asChild>
                          <Link href={project.project_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </Button>
                      )}
                      {project.github_url && (
                        <Button size="sm" variant="outline" asChild>
                          <Link href={project.github_url} target="_blank" rel="noopener noreferrer">
                            <Github className="h-3 w-3" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty State */}
      {projects.length === 0 && (
        <section className="py-20">
          <div className="container">
            <div className="max-w-2xl mx-auto text-center space-y-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Star className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold">Portfolio Coming Soon</h2>
              <p className="text-muted-foreground">
                We're currently updating our portfolio with our latest projects. Check back soon to see our amazing work!
              </p>
              <Button asChild>
                <Link href="/contact">Discuss Your Project</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section - Only show if we have projects */}
      {projects.length > 0 && (
        <section className="py-20">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <h2 className="text-3xl lg:text-4xl font-bold">Ready to Start Your Project?</h2>
              <p className="text-xl text-muted-foreground">
                Let's discuss how we can help you achieve similar success with your technology project
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/contact">Start Your Project</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/services">View Services</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}