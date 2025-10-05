import { getCaseStudyBySlug, getAllCaseStudies } from "@/lib/queries/content"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { Calendar, Users, Clock, Github, ExternalLink, ArrowLeft } from "lucide-react"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  try {
    const caseStudy = await getCaseStudyBySlug(params.slug)

    if (!caseStudy || !caseStudy.is_published) {
      return {
        title: "Case Study Not Found",
      }
    }

    return {
      title: caseStudy.meta_title || `${caseStudy.title} - Case Study | Kamisoft Enterprises`,
      description:
        caseStudy.meta_description ||
        caseStudy.description ||
        "Case study showcasing our expertise",
      openGraph: {
        title: caseStudy.meta_title || caseStudy.title,
        description: caseStudy.meta_description || caseStudy.description,
        images: caseStudy.cover_image_url ? [{ url: caseStudy.cover_image_url }] : [],
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title: caseStudy.meta_title || caseStudy.title,
        description: caseStudy.meta_description || caseStudy.description,
        images: caseStudy.cover_image_url ? [caseStudy.cover_image_url] : [],
      },
    }
  } catch (error) {
    return {
      title: "Case Study Not Found",
    }
  }
}

export default async function CaseStudyPage({ params }: { params: { slug: string } }) {
  let caseStudy
  try {
    caseStudy = await getCaseStudyBySlug(params.slug)
  } catch (error) {
    notFound()
  }

  if (!caseStudy || !caseStudy.is_published) {
    notFound()
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-12 lg:py-20 bg-gradient-to-br from-background to-muted/50">
        <div className="container">
          <Button variant="ghost" size="sm" asChild className="mb-8">
            <Link href="/case-studies">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Case Studies
            </Link>
          </Button>

          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2 mb-4 flex-wrap">
              {caseStudy.service_category && (
                <Badge variant="secondary" className="capitalize">
                  {caseStudy.service_category.replace(/_/g, " ")}
                </Badge>
              )}
              {caseStudy.industry && (
                <Badge variant="outline" className="capitalize">
                  {caseStudy.industry}
                </Badge>
              )}
              {caseStudy.tags?.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold mb-6">{caseStudy.title}</h1>

            {caseStudy.description && (
              <p className="text-xl text-muted-foreground mb-8">{caseStudy.description}</p>
            )}

            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              {caseStudy.client_name && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Client:</span> {caseStudy.client_name}
                </div>
              )}
              {caseStudy.completion_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(caseStudy.completion_date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                  })}
                </div>
              )}
              {caseStudy.project_duration && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {caseStudy.project_duration}
                </div>
              )}
              {caseStudy.team_size && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {caseStudy.team_size} team members
                </div>
              )}
            </div>

            {(caseStudy.live_url || caseStudy.github_url) && (
              <div className="flex gap-4 mt-8">
                {caseStudy.live_url && (
                  <Button asChild>
                    <a href={caseStudy.live_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Live Project
                    </a>
                  </Button>
                )}
                {caseStudy.github_url && (
                  <Button variant="outline" asChild>
                    <a href={caseStudy.github_url} target="_blank" rel="noopener noreferrer">
                      <Github className="mr-2 h-4 w-4" />
                      View Repository
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Cover Image */}
      {caseStudy.cover_image_url && (
        <section className="py-0">
          <div className="container">
            <div className="max-w-5xl mx-auto -mt-12 relative h-[400px] rounded-lg overflow-hidden border">
              <Image
                src={caseStudy.cover_image_url}
                alt={caseStudy.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none mb-12">
              <div dangerouslySetInnerHTML={{ __html: caseStudy.content }} />
            </div>

            {/* Challenge, Solution, Results */}
            {(caseStudy.challenge || caseStudy.solution || caseStudy.results) && (
              <div className="grid gap-6 mb-12">
                {caseStudy.challenge && (
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-xl font-bold mb-3">Challenge</h3>
                      <p className="text-muted-foreground">{caseStudy.challenge}</p>
                    </CardContent>
                  </Card>
                )}
                {caseStudy.solution && (
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-xl font-bold mb-3">Solution</h3>
                      <p className="text-muted-foreground">{caseStudy.solution}</p>
                    </CardContent>
                  </Card>
                )}
                {caseStudy.results && (
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-xl font-bold mb-3">Results & Impact</h3>
                      <p className="text-muted-foreground">{caseStudy.results}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Technologies */}
            {caseStudy.technologies && caseStudy.technologies.length > 0 && (
              <div className="mb-12">
                <h3 className="text-2xl font-bold mb-4">Technologies Used</h3>
                <div className="flex flex-wrap gap-2">
                  {caseStudy.technologies.map((tech) => (
                    <Badge key={tech} variant="secondary">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Metrics */}
            {caseStudy.metrics && Object.keys(caseStudy.metrics).length > 0 && (
              <div className="mb-12">
                <h3 className="text-2xl font-bold mb-6">Key Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(caseStudy.metrics).map(([key, value]) => (
                    <Card key={key}>
                      <CardContent className="pt-6 text-center">
                        <div className="text-3xl font-bold text-primary mb-2">
                          {String(value)}
                        </div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {key.replace(/_/g, " ")}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Gallery */}
            {caseStudy.gallery_images && caseStudy.gallery_images.length > 0 && (
              <div className="mb-12">
                <h3 className="text-2xl font-bold mb-6">Project Gallery</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {caseStudy.gallery_images.map((imageUrl, idx) => (
                    <div key={idx} className="relative h-64 rounded-lg overflow-hidden border">
                      <Image src={imageUrl} alt={`${caseStudy.title} gallery ${idx + 1}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Your Project?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Let&apos;s discuss how we can help bring your vision to life.
            </p>
            <Button size="lg" asChild>
              <Link href="/contact">Get In Touch</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
