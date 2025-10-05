import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CaseStudy } from "@/lib/types/database"
import { Calendar, Users, Clock } from "lucide-react"

interface CaseStudyCardProps {
  caseStudy: CaseStudy
}

export function CaseStudyCard({ caseStudy }: CaseStudyCardProps) {
  return (
    <Link href={`/case-studies/${caseStudy.slug}`}>
      <Card className="h-full hover:shadow-lg transition-shadow duration-300 group">
        {caseStudy.featured_image_url && (
          <div className="overflow-hidden rounded-t-lg">
            <img
              src={caseStudy.featured_image_url}
              alt={caseStudy.featured_image_alt || caseStudy.title}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <CardHeader>
          <div className="flex gap-2 mb-2">
            <Badge variant="secondary">{caseStudy.service_category.replace(/_/g, " ")}</Badge>
            {caseStudy.is_featured && <Badge variant="default">Featured</Badge>}
          </div>
          <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
            {caseStudy.title}
          </CardTitle>
          {caseStudy.subtitle && (
            <p className="text-sm text-muted-foreground line-clamp-1">{caseStudy.subtitle}</p>
          )}
        </CardHeader>
        <CardContent>
          {!caseStudy.is_client_confidential && caseStudy.client_name && (
            <p className="text-sm font-medium mb-2">Client: {caseStudy.client_name}</p>
          )}
          <div className="flex gap-4 text-xs text-muted-foreground mb-3">
            {caseStudy.completion_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(caseStudy.completion_date).getFullYear()}</span>
              </div>
            )}
            {caseStudy.team_size && (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{caseStudy.team_size} people</span>
              </div>
            )}
            {caseStudy.project_duration_months && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{caseStudy.project_duration_months} months</span>
              </div>
            )}
          </div>
          {caseStudy.technologies && caseStudy.technologies.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {caseStudy.technologies.slice(0, 4).map((tech) => (
                <Badge key={tech} variant="outline" className="text-xs">
                  {tech}
                </Badge>
              ))}
              {caseStudy.technologies.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{caseStudy.technologies.length - 4}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
