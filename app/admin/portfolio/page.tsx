// app/admin/portfolio/page.tsx
export const dynamic = "force-dynamic";

import { requireAuth } from "@/lib/auth/server-auth"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Briefcase, Plus, Edit, Trash2, Eye, EyeOff, Star } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default async function PortfolioManagementPage() {
  // Require authentication
  await requireAuth()
  
  const supabase = createServerClient()

  const { data: projects, error } = await supabase
    .from("portfolio_projects")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching portfolio projects:", error)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Portfolio Management</h1>
          <p className="text-muted-foreground mt-2">Manage your portfolio projects and showcase your work</p>
        </div>
        <Button asChild>
          <Link href="/admin/portfolio/new">
            <Plus className="mr-2 h-4 w-4" />
            Add New Project
          </Link>
        </Button>
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: any) => (
            <Card key={project.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader className="p-4">
                {project.featured_image_url ? (
                  <div className="relative w-full h-40 mb-4 rounded-lg overflow-hidden">
                    <Image
                      src={project.featured_image_url}
                      alt={project.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                ) : (
                  <div className="w-full h-40 bg-muted rounded-lg flex items-center justify-center mb-4">
                    <Briefcase className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">{project.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {project.service_category?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1 ml-2">
                    {project.is_featured && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    {project.is_published ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <Eye className="h-3 w-3 mr-1" />
                        Published
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Draft
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {project.description}
                </p>
                
                {project.client_name && (
                  <p className="text-sm mb-2">
                    <strong>Client:</strong> {project.client_name}
                  </p>
                )}
                
                {project.technologies && project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {project.technologies.slice(0, 3).map((tech: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                    {project.technologies.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{project.technologies.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                  {project.completion_date && (
                    <span>Completed: {new Date(project.completion_date).toLocaleDateString()}</span>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" asChild>
                    <Link href={`/admin/portfolio/${project.id}/edit`}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                
                {(project.project_url || project.github_url) && (
                  <div className="flex gap-2 mt-2">
                    {project.project_url && (
                      <Button size="sm" variant="ghost" className="flex-1 text-xs" asChild>
                        <Link href={project.project_url} target="_blank">
                          View Live
                        </Link>
                      </Button>
                    )}
                    {project.github_url && (
                      <Button size="sm" variant="ghost" className="flex-1 text-xs" asChild>
                        <Link href={project.github_url} target="_blank">
                          GitHub
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No portfolio projects yet</h3>
            <p className="text-muted-foreground mb-6">Start building your portfolio by adding your first project.</p>
            <Button asChild>
              <Link href="/admin/portfolio/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Project
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}