"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PortfolioActions } from "@/components/admin/portfolio-actions"
import { getImageDisplayUrl, generateProjectImagePlaceholder } from "@/lib/image-utils"
import { Calendar, ExternalLink, Star, Image as ImageIcon, Loader2 } from "lucide-react"
import Link from "next/link"

interface Project {
  id: string
  title: string
  description: string
  featured_image_url?: string
  project_url?: string
  technologies?: string[]
  client_feedback?: string
  client_rating?: number
  completion_date?: string
  service_category?: string
  is_featured: boolean
  is_published: boolean
}

interface PortfolioProjectCardProps {
  project: Project
  showActions?: boolean
  className?: string
}

export function PortfolioProjectCard({
  project,
  showActions = true,
  className = ""
}: PortfolioProjectCardProps) {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  const displayImageUrl = getImageDisplayUrl(project.featured_image_url)
  const hasImage = displayImageUrl || project.project_url

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  const handleImageError = () => {
    setImageLoading(false)
    setImageError(true)
  }

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 ${className}`}>
      {/* Project Image */}
      {hasImage && (
        <div className="relative h-48 overflow-hidden rounded-t-lg bg-muted">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          <img
            src={displayImageUrl || generateProjectImagePlaceholder(project.title)}
            alt={project.title}
            className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />

          {/* Featured Badge Overlay */}
          {project.is_featured && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-yellow-500 text-white shadow-md">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Featured
              </Badge>
            </div>
          )}

          {/* Image Source Indicator */}
          {!project.featured_image_url && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="bg-white/90 rounded-full p-2 shadow-md">
                <ImageIcon className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          )}
        </div>
      )}

      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <CardTitle className="text-lg line-clamp-2">{project.title}</CardTitle>
          <div className="flex gap-2">
            {/* Only show featured badge if no image is displayed */}
            {!hasImage && project.is_featured && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
            <Badge variant={project.is_published ? "default" : "secondary"}>
              {project.is_published ? "Published" : "Draft"}
            </Badge>
          </div>
        </div>
        <CardDescription className="line-clamp-2">
          {project.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-4">
          {/* Technologies */}
          <div className="flex flex-wrap gap-2">
            {project.technologies?.slice(0, 3).map((tech: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tech}
              </Badge>
            ))}
            {project.technologies && project.technologies.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{project.technologies.length - 3} more
              </Badge>
            )}
          </div>

          {/* Client Feedback */}
          {project.client_feedback && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-1">Client Feedback</p>
              <p className="text-sm italic line-clamp-2">"{project.client_feedback}"</p>
              {project.client_rating && (
                <div className="flex items-center mt-2">
                  <span className="text-xs text-muted-foreground mr-1">Rating:</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < project.client_rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Project Meta */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {project.completion_date
                ? new Date(project.completion_date).toLocaleDateString()
                : "In Progress"
              }
            </span>
            {project.service_category && (
              <span className="capitalize">
                {project.service_category.replace("_", " ")}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="flex gap-2 pt-4 border-t">
              <Button size="sm" variant="outline" className="flex-1" asChild>
                <Link href={`/admin/portfolio/edit/${project.id}`}>
                  Edit
                </Link>
              </Button>
              {project.project_url && (
                <Button size="sm" variant="outline" asChild>
                  <Link href={project.project_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </Button>
              )}
              <PortfolioActions projectId={project.id} projectTitle={project.title} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}