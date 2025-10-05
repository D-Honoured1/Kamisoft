import { getAllCaseStudies } from "@/lib/queries/content"
import { CaseStudyCard } from "@/components/case-study-card"
import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "Case Studies | Kamisoft Enterprises - Success Stories",
  description:
    "Explore our portfolio of successful projects. Real-world case studies showcasing our expertise in software development, blockchain, and fintech.",
}

export default async function CaseStudiesPage() {
  const caseStudies = await getAllCaseStudies({ published_only: true })

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
          {caseStudies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {caseStudies.map((caseStudy) => (
                <CaseStudyCard key={caseStudy.id} caseStudy={caseStudy} />
              ))}
            </div>
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
