"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { FileText, Download, Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface InvoiceGeneratorProps {
  requestId: string
  paymentId?: string
  clientEmail: string
  clientName: string
  estimatedCost?: number
  existingInvoices?: Array<{
    id: string
    invoice_number: string
    status: string
    pdf_url?: string
    total_amount: number
    created_at: string
  }>
}

export function InvoiceGenerator({
  requestId,
  paymentId,
  clientEmail,
  clientName,
  estimatedCost,
  existingInvoices = []
}: InvoiceGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [autoSend, setAutoSend] = useState(false)
  const { toast } = useToast()

  const hasInvoices = existingInvoices.length > 0

  const handleGenerateInvoice = async () => {
    setIsGenerating(true)

    try {
      const response = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          paymentId,
          autoSend
        })
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.details || data.error || 'Failed to generate invoice'
        throw new Error(errorMessage)
      }

      toast({
        title: "Invoice Generated!",
        description: (
          <div>
            <p>Invoice #{data.invoice.invoiceNumber} has been created.</p>
            {autoSend && <p className="mt-1">Email sent to {clientEmail}</p>}
          </div>
        )
      })

      // Refresh the page to show new invoice
      setTimeout(() => {
        window.location.reload()
      }, 1500)

    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate invoice",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'sent':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default: // draft
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Invoice Management
        </CardTitle>
        <CardDescription>
          Generate and manage invoices for this service request
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Invoices */}
        {hasInvoices && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Existing Invoices</h4>
            {existingInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-2"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{invoice.invoice_number}</p>
                    <Badge className={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ${invoice.total_amount.toLocaleString()} •{' '}
                    {new Date(invoice.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {invoice.pdf_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                    >
                      <a
                        href={invoice.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        PDF
                      </a>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                  >
                    <a href={`/admin/invoices/${invoice.id}`}>
                      View
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Generate New Invoice */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-2">Generate New Invoice</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Client: {clientName}</p>
              <p>• Email: {clientEmail}</p>
              {estimatedCost && <p>• Amount: ${estimatedCost.toLocaleString()}</p>}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="auto-send"
              checked={autoSend}
              onCheckedChange={(checked) => setAutoSend(checked as boolean)}
            />
            <Label
              htmlFor="auto-send"
              className="text-sm font-normal cursor-pointer"
            >
              Send invoice to client via email automatically
            </Label>
          </div>

          <Button
            onClick={handleGenerateInvoice}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Invoice...
              </>
            ) : autoSend ? (
              <>
                <Send className="mr-2 h-4 w-4" />
                Generate & Send Invoice
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate Invoice
              </>
            )}
          </Button>
        </div>

        {/* Info */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">Invoice Details:</p>
            <ul className="space-y-1 text-xs">
              <li>• Professional PDF with company branding</li>
              <li>• Includes 7.5% VAT (Nigerian standard)</li>
              <li>• 30-day payment terms</li>
              <li>• Bank transfer details included</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}