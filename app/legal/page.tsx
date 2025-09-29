import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Shield, Cookie, Scale, Calendar } from "lucide-react"
import Link from "next/link"

const legalDocuments = [
  {
    title: "Privacy Policy",
    description: "How we collect, use, and protect your personal information",
    href: "/legal/privacy-policy",
    icon: Shield,
    lastUpdated: "December 2024",
    category: "Privacy & Data"
  },
  {
    title: "Terms of Service",
    description: "Terms and conditions for using our services",
    href: "/legal/terms-of-service",
    icon: Scale,
    lastUpdated: "December 2024",
    category: "Terms & Conditions"
  },
  {
    title: "Cookie Policy",
    description: "Information about cookies and similar technologies we use",
    href: "/legal/cookie-policy",
    icon: Cookie,
    lastUpdated: "December 2024",
    category: "Privacy & Data"
  }
]

export default function LegalPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Legal Documents</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Our commitment to transparency and legal compliance. Find all our legal documents,
          policies, and terms in one place.
        </p>
      </div>

      {/* Company Information Card */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold">Kamisoft Enterprises</h2>
            <p className="text-muted-foreground">A subsidiary of Amor Group</p>
            <p className="text-sm text-muted-foreground">
              Lagos, Nigeria • Contact: support@kamisoftenterprises.online
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                All documents last reviewed: December 2024
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
        {legalDocuments.map((doc) => {
          const Icon = doc.icon
          return (
            <Card key={doc.href} className="group hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {doc.category}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{doc.title}</CardTitle>
                <CardDescription className="text-sm">
                  {doc.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Updated {doc.lastUpdated}
                  </span>
                  <Button asChild size="sm">
                    <Link href={doc.href}>
                      Read Document
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Important Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-semibold mb-2">Document Updates</h3>
              <p className="text-sm text-muted-foreground">
                We regularly review and update our legal documents to ensure compliance
                with current laws and regulations. Users will be notified of significant changes.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Questions or Concerns</h3>
              <p className="text-sm text-muted-foreground">
                If you have any questions about these documents or our practices,
                please don't hesitate to contact us at{" "}
                <Link
                  href="mailto:support@kamisoftenterprises.online"
                  className="text-primary hover:underline"
                >
                  support@kamisoftenterprises.online
                </Link>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}