"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { getAllCaseStudies, deleteCaseStudy } from "@/lib/queries/content"
import type { CaseStudy } from "@/lib/types/database"
import { Plus, Edit, Trash2, Search, ExternalLink } from "lucide-react"
import Image from "next/image"

export default function AdminCaseStudiesPage() {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([])
  const [filteredCaseStudies, setFilteredCaseStudies] = useState<CaseStudy[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  useEffect(() => {
    loadCaseStudies()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = caseStudies.filter(
        (cs) =>
          cs.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cs.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cs.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cs.industry?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredCaseStudies(filtered)
    } else {
      setFilteredCaseStudies(caseStudies)
    }
  }, [searchTerm, caseStudies])

  async function loadCaseStudies() {
    try {
      const data = await getAllCaseStudies()
      setCaseStudies(data)
      setFilteredCaseStudies(data)
    } catch (error) {
      console.error("Failed to load case studies:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete the case study: "${title}"?`)) return

    try {
      await deleteCaseStudy(id)
      setCaseStudies(caseStudies.filter((cs) => cs.id !== id))
    } catch (error) {
      console.error("Failed to delete case study:", error)
      alert("Failed to delete case study")
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading case studies...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Case Studies</h1>
          <p className="text-muted-foreground mt-1">{caseStudies.length} total case studies</p>
        </div>
        <Button asChild>
          <Link href="/admin/case-studies/new">
            <Plus className="mr-2 h-4 w-4" />
            New Case Study
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search case studies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredCaseStudies.map((caseStudy) => (
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
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(caseStudy.id, caseStudy.title)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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
                <span>Order: {caseStudy.display_order}</span>
                <span>Created: {new Date(caseStudy.created_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredCaseStudies.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {searchTerm
                ? "No case studies found matching your search."
                : "No case studies found. Create your first one to get started."}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
