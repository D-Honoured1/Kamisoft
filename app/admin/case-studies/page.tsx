export const dynamic = "force-dynamic"

import { requireAuth } from "@/lib/auth/server-auth"
import { createServerClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DashboardHomeButton } from "@/components/admin-navigation/dashboard-home-button"
import { Plus, Edit, ExternalLink } from "lucide-react"
import Image from "next/image"
import { CaseStudyActions } from "@/components/admin/case-study-actions"

export default async function AdminCaseStudiesPage() {
  await requireAuth()

  const supabase = createServerClient()

  const { data: caseStudies, error } = await supabase
    .from("case_studies")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Failed to load case studies:", error)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardHomeButton />

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Case Studies</h1>
          <p className="text-muted-foreground mt-1">{caseStudies?.length || 0} total case studies</p>
        </div>
        <Button asChild>
          <Link href="/admin/case-studies/new">
            <Plus className="mr-2 h-4 w-4" />
            New Case Study
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {caseStudies && caseStudies.length > 0 ? caseStudies.map((caseStudy: any) => (
          <Card key={caseStudy.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="flex gap-4 flex-1">
                {caseStudy.cover_image_url && (
                  <div className="relative h-24 w-32 rounded-lg overflow-hidden">
                    <Image
                      src={caseStudy.cover_image_url}
                      alt={caseStudy.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{caseStudy.title}</CardTitle>
                  {caseStudy.client_name && (
                    <p className="text-sm text-muted-foreground mb-2">
                      Client: {caseStudy.client_name}
                    </p>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    {caseStudy.is_published ? (
                      <Badge variant="default">Published</Badge>
                    ) : (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                    {caseStudy.is_featured && <Badge variant="outline">Featured</Badge>}
                    {caseStudy.industry && (
                      <Badge variant="outline" className="capitalize">
                        {caseStudy.industry}
                      </Badge>
                    )}
                    {caseStudy.service_category && (
                      <Badge variant="outline" className="capitalize">
                        {caseStudy.service_category.replace(/_/g, " ")}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {caseStudy.live_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={caseStudy.live_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/case-studies/edit/${caseStudy.id}`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
                <CaseStudyActions caseStudyId={caseStudy.id} caseStudyTitle={caseStudy.title} />
              </div>
            </CardHeader>
            <CardContent>
              {caseStudy.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {caseStudy.description}
                </p>
              )}
              <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
                {caseStudy.project_duration && <span>Duration: {caseStudy.project_duration}</span>}
                {caseStudy.team_size && <span>Team: {caseStudy.team_size} members</span>}
                {caseStudy.technologies?.length > 0 && (
                  <span>Tech: {caseStudy.technologies.slice(0, 3).join(", ")}</span>
                )}
                <span>Order: {caseStudy.display_order || 0}</span>
                <span>Created: {new Date(caseStudy.created_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        )) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No case studies found. Create your first one to get started.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
