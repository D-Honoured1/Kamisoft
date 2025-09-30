// app/admin/invoices/[id]/page.tsx - Invoice Detail Page
export const dynamic = "force-dynamic"

import { createServerClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server-auth"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, FileText, Mail, Calendar, DollarSign } from "lucide-react"
import Link from "next/link"

interface InvoiceDetailProps {
  params: {
    id: string
  }
}

export default async function InvoiceDetail({ params }: InvoiceDetailProps) {
  await requireAuth()
  const supabase = createServerClient()

  // Get invoice details with related data
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select(`
      *,
      service_requests (
        id,
        title,
        description,
        service_category,
        clients (
          id,
          name,
          email,
          company,
          address
        )
      ),
      payments (
        id,
        amount,
        payment_status,
        payment_method,
        created_at
      )
    `)
    .eq("id", params.id)
    .single()

  if (error || !invoice) {
    notFound()
  }

  const client = (invoice.service_requests as any)?.clients
  const serviceRequest = invoice.service_requests as any
  const payment = (invoice.payments as any)?.[0]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "sent":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "cancelled":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      default: // draft
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/requests/${serviceRequest?.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Request
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Invoice {invoice.invoice_number}</h1>
            <p className="text-muted-foreground">
              Created {new Date(invoice.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(invoice.status)}>
            {invoice.status.toUpperCase()}
          </Badge>
          {invoice.pdf_url && (
            <Button asChild>
              <a href={invoice.pdf_url} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{client?.name}</p>
            </div>
            {client?.company && (
              <div>
                <p className="text-sm text-muted-foreground">Company</p>
                <p className="font-medium">{client.company}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{client?.email}</p>
            </div>
            {client?.address && (
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{client.address}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Invoice Date</p>
              <p className="font-medium">
                {new Date(invoice.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            {invoice.due_date && (
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-medium">
                  {new Date(invoice.due_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="font-medium">
                {new Date(invoice.updated_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Service Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="text-sm text-muted-foreground">Service Title</p>
            <p className="font-medium">{serviceRequest?.title}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Category</p>
            <p className="font-medium capitalize">
              {serviceRequest?.service_category?.replace(/_/g, ' ')}
            </p>
          </div>
          {serviceRequest?.description && (
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="font-medium">{serviceRequest.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Amount Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Amount Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">${invoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Tax (7.5% VAT)</span>
              <span className="font-medium">${invoice.tax_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-3 text-lg font-bold bg-muted rounded-lg px-4">
              <span>Total Amount</span>
              <span className="text-green-600">${invoice.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      {payment && (
        <Card>
          <CardHeader>
            <CardTitle>Associated Payment</CardTitle>
            <CardDescription>Payment linked to this invoice</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="font-medium">${payment.amount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant="outline">{payment.payment_status}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Method</p>
                <p className="font-medium capitalize">{payment.payment_method.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">
                  {new Date(payment.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PDF Preview */}
      {invoice.pdf_url && (
        <Card>
          <CardHeader>
            <CardTitle>PDF Document</CardTitle>
            <CardDescription>Invoice PDF preview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg text-center space-y-4">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Invoice PDF is available for download
              </p>
              <Button asChild>
                <a href={invoice.pdf_url} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Download Invoice PDF
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}