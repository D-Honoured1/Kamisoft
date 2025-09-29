"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, FileText, Download, Print } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"

interface LegalDocumentLayoutProps {
  title: string
  description: string
  lastUpdated: string
  effectiveDate: string
  children: React.ReactNode
  showPrintButton?: boolean
  showDownloadButton?: boolean
}

export function LegalDocumentLayout({
  title,
  description,
  lastUpdated,
  effectiveDate,
  children,
  showPrintButton = true,
  showDownloadButton = false,
}: LegalDocumentLayoutProps) {
  const handlePrint = () => {
    window.print()
  }

  // Add print styles dynamically on client side only
  useEffect(() => {
    const printStyles = `
      @media print {
        body {
          font-size: 12pt !important;
          line-height: 1.4 !important;
        }

        .no-print {
          display: none !important;
        }

        .print\\:shadow-none {
          box-shadow: none !important;
        }

        .print\\:border-0 {
          border: none !important;
        }

        h1, h2, h3 {
          break-after: avoid;
          page-break-after: avoid;
        }

        .prose h2 {
          margin-top: 2rem !important;
          margin-bottom: 1rem !important;
        }

        .prose p {
          margin-bottom: 1rem !important;
        }

        .prose ul, .prose ol {
          margin-bottom: 1rem !important;
        }
      }
    `

    const styleElement = document.createElement('style')
    styleElement.textContent = printStyles
    document.head.appendChild(styleElement)

    // Cleanup function
    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header with Navigation */}
      <div className="flex items-center gap-4 mb-8 no-print">
        <Button variant="outline" size="sm" asChild>
          <Link href="/legal">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Legal
          </Link>
        </Button>
        <div className="flex gap-2">
          {showPrintButton && (
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Print className="h-4 w-4 mr-2" />
              Print
            </Button>
          )}
          {showDownloadButton && (
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          )}
        </div>
      </div>

      {/* Document Header */}
      <Card className="mb-8 print:shadow-none print:border-0">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FileText className="h-8 w-8 text-primary" />
            <Badge variant="secondary" className="text-sm">Legal Document</Badge>
          </div>
          <CardTitle className="text-3xl font-bold">{title}</CardTitle>
          <CardDescription className="text-lg mt-2">{description}</CardDescription>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Effective: {effectiveDate}</span>
            </div>
            <Separator orientation="vertical" className="hidden sm:block h-4" />
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Last Updated: {lastUpdated}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Company Information */}
      <Card className="mb-8 print:shadow-none print:border-0">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">Kamisoft Enterprises</h2>
            <p className="text-muted-foreground">A subsidiary of Amor Group</p>
            <p className="text-sm text-muted-foreground">
              Lagos, Nigeria • Contact: hello@kamisoftenterprises.online
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Document Content */}
      <div className="prose prose-gray dark:prose-invert max-w-none">
        {children}
      </div>

      {/* Footer */}
      <Card className="mt-12 print:shadow-none print:border-0">
        <CardContent className="pt-6">
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>
              If you have any questions about this document, please contact us at{" "}
              <Link href="mailto:hello@kamisoftenterprises.online" className="text-primary hover:underline">
                hello@kamisoftenterprises.online
              </Link>
            </p>
            <p>© {new Date().getFullYear()} Kamisoft Enterprises. All rights reserved.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}