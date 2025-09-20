// app/admin/portfolio/page.tsx
export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DashboardHomeButton } from "@/components/admin-navigation/dashboard-home-button"
import { Button } from "@/components/ui/button"
import { Briefcase, Plus, Eye, Calendar, ExternalLink, Star } from "lucide-react"
import Link from "next/link"

export default async function PortfolioPage() {
  // Require authentication
  const adminUser = await requireAuth()
  
  const supabase = createServerClient()

  const { data: projects, error } = await supabase
    .from("portfolio_projects")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching portfolio projects:", error)
  }

  const publishedProjects = projects?.filter(p => p.is_published) || []
  const featuredProjects = projects?.filter(p => p.is_featured) || []

  return (
    <div className="container mx-auto px-4 py-8">
    <DashboardHomeButton />
    
    <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Portfolio Management</h1>
          <p className="text-muted-foreground mt-2">Manage your portfolio projects and showcases</p>
        </div>
        <Button asChild>
          <Link href="/admin/portfolio/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Project
          </Link>
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold text-foreground">{projects?.length || 0}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Published</p>
                <p className="text-2xl font-bold text-green-600">{publishedProjects.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Featured</p>
                <p className="text-2xl font-bold text-yellow-600">{featuredProjects.length}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Grid */}
      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: any) => (
            <Card key={project.id} className="group hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-lg line-clamp-2">{project.title}</CardTitle>
                  <div className="flex gap-2">
                    {project.is_featured && (
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
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {project.technologies?.slice(0, 3).map((tech: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                    {project.technologies?.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{project.technologies.length - 3} more
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {project.completion_date 
                        ? new Date(project.completion_date).toLocaleDateString()
                        : "In Progress"
                      }
                    </span>
                    {project.service_category && (
                      <span className="capitalize">{project.service_category.replace("_", " ")}</span>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button size="sm" variant="outline" className="flex-1" asChild>
                      <Link href={`/admin/portfolio/${project.id}`}>
                        Edit
                      </Link>
                    </Button>
                    {project.project_url && (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={project.project_url} target="_blank">
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No portfolio projects yet</h3>
            <p className="text-muted-foreground mb-4">Start building your portfolio by adding your first project.</p>
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