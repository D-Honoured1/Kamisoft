"use client"

import { useEffect, useState } from "react"
import { CaseStudyCard } from "@/components/case-study-card"
import { Badge } from "@/components/ui/badge"
import { InfiniteCarousel } from "@/components/ui/infinite-carousel"

export default function CaseStudiesPage() {
  const [caseStudies, setCaseStudies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCaseStudies() {
      try {
        const response = await fetch('/api/admin/case-studies')
        if (response.ok) {
          const data = await response.json()
          setCaseStudies(data.caseStudies?.filter((c: any) => c.is_published) || [])
        }
      } catch (error) {
        console.error('Failed to load case studies:', error)
      } finally {
        setLoading(false)
      }
    }
    loadCaseStudies()
  }, [])

  return (
    <div className="flex flex-col">
      <section className="py-20 lg:py-32 bg-gradient-to-br from-background to-muted/50">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="text-sm">
              Case Studies
            </Badge>

            <h1 className="text-4xl lg:text-6xl font-bold text-balance">
              Our <span className="text-primary">Success Stories</span>
            </h1>

            <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
              Real-world projects that showcase our expertise and deliver measurable results for
              clients.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading case studies...</p>
            </div>
          ) : caseStudies.length > 0 ? (
            <InfiniteCarousel>
              {caseStudies.map((caseStudy) => (
                <CaseStudyCard key={caseStudy.id} caseStudy={caseStudy} />
              ))}
            </InfiniteCarousel>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No case studies published yet. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
