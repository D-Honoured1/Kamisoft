import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Github, Calendar, Star } from "lucide-react"
import Link from "next/link"

export default function PortfolioPage() {
  // This would normally come from the database
  const portfolioProjects = [
    {
      id: "1",
      title: "Banking Mobile App",
      description:
        "Complete mobile banking solution with biometric authentication, real-time transactions, and advanced security features.",
      service_category: "fintech_platforms",
      client_name: "First Crypto Bank",
      project_url: "https://firstcryptobank.com/mobile",
      github_url: null,
      technologies: ["React Native", "Node.js", "PostgreSQL", "Redis", "AWS"],
      completion_date: "2023-12-15",
      is_featured: true,
      featured_image_url: "/mobile-banking-app.png",
    },
    {
      id: "2",
      title: "E-learning Platform",
      description:
        "Comprehensive online learning management system with video streaming, interactive quizzes, and progress tracking.",
      service_category: "full_stack_development",
      client_name: "Glorious Spring Schools",
      project_url: "https://gss.edu.ng/elearning",
      github_url: null,
      technologies: ["Next.js", "TypeScript", "Prisma", "Supabase", "Vercel"],
      completion_date: "2023-10-20",
      is_featured: true,
      featured_image_url: "/e-learning-dashboard.png",
    },
    {
      id: "3",
      title: "Supply Chain DApp",
      description: "Blockchain-based supply chain tracking system ensuring transparency and authenticity of products.",
      service_category: "blockchain_solutions",
      client_name: "Amor Group",
      project_url: null,
      github_url: "https://github.com/kamisoft/supply-chain-dapp",
      technologies: ["Solidity", "Web3.js", "React", "IPFS", "Ethereum"],
      completion_date: "2024-02-28",
      is_featured: true,
      featured_image_url: "/blockchain-supply-chain-interface.jpg",
    },
    {
      id: "4",
      title: "Hospital Management System",
      description:
        "Complete hospital management solution with patient records, appointment scheduling, and billing integration.",
      service_category: "full_stack_development",
      client_name: "Central State Hospital",
      project_url: null,
      github_url: null,
      technologies: ["Vue.js", "Laravel", "MySQL", "Docker", "AWS"],
      completion_date: "2023-08-10",
      is_featured: false,
      featured_image_url: "/hospital-management-system-interface.png",
    },
    {
      id: "5",
      title: "Cryptocurrency Exchange",
      description:
        "Secure cryptocurrency trading platform with advanced charting, order matching, and wallet integration.",
      service_category: "blockchain_solutions",
      client_name: "CryptoNaira",
      project_url: "https://cryptonaira.com",
      github_url: null,
      technologies: ["React", "Node.js", "MongoDB", "WebSocket", "Kubernetes"],
      completion_date: "2024-01-25",
      is_featured: true,
      featured_image_url: "/cryptocurrency-exchange-platform.jpg",
    },
    {
      id: "6",
      title: "IoT Smart Home System",
      description:
        "Comprehensive IoT solution for smart home automation with mobile app control and AI-powered optimization.",
      service_category: "ai_automation",
      client_name: "Smart Living Ltd",
      project_url: null,
      github_url: "https://github.com/kamisoft/smart-home-iot",
      technologies: ["Python", "TensorFlow", "React Native", "MQTT", "Raspberry Pi"],
      completion_date: "2023-11-05",
      is_featured: false,
      featured_image_url: "/smart-home-iot-interface.jpg",
    },
  ]

  const getCategoryBadge = (category: string) => {
    const categoryMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      fintech_platforms: { label: "Fintech", variant: "default" },
      full_stack_development: { label: "Full-Stack", variant: "secondary" },
      blockchain_solutions: { label: "Blockchain", variant: "outline" },
      ai_automation: { label: "AI/IoT", variant: "default" },
    }

    const config = categoryMap[category] || { label: category, variant: "outline" as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const featuredProjects = portfolioProjects.filter((p) => p.is_featured)
  const otherProjects = portfolioProjects.filter((p) => !p.is_featured)

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
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                      <span className="font-medium">{project.client_name}</span>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(project.completion_date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                          })}
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
                      {project.technologies.slice(0, 4).map((tech, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                      {project.technologies.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{project.technologies.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>

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

      {/* Other Projects */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold">More Projects</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Additional successful implementations across various industries
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
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">{getCategoryBadge(project.service_category)}</div>
                </div>

                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="font-medium">{project.client_name}</span>
                    <span>{new Date(project.completion_date).getFullYear()}</span>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <CardDescription className="text-sm leading-relaxed mb-4">{project.description}</CardDescription>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {project.technologies.slice(0, 3).map((tech, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
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

      {/* CTA Section */}
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
    </div>
  )
}
