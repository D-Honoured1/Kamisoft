// app/admin/contact-submissions/page.tsx - FIXED VERSION WITH SEPARATE TABLE
export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DashboardHomeButton } from "@/components/admin-navigation/dashboard-home-button"
import { Mail, Phone, Building, Calendar, MessageSquare, ArrowRight, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"

export default async function ContactSubmissions() {
  const adminUser = await requireAuth()
  const supabase = createServerClient()

  // Get contact submissions from contact_inquiries table
  const { data: contactSubmissions, error: contactError } = await supabase
    .from("contact_inquiries")
    .select(`
      *,
      clients (
        name,
        email,
        phone,
        company
      )
    `)
    .order("created_at", { ascending: false })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const pendingCount = contactSubmissions?.filter(sub => sub.status === 'pending').length || 0
  const completedCount = contactSubmissions?.filter(sub => sub.status === 'completed').length || 0

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardHomeButton />
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contact Submissions</h1>
          <p className="text-muted-foreground mt-2">Review all contact form submissions</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Submissions</p>
                <p className="text-3xl font-bold text-purple-600">{contactSubmissions?.length || 0}</p>
              </div>
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold text-green-600">{completedCount}</p>
              </div>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Submissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Contact Form Submissions
          </CardTitle>
          <CardDescription>All submissions from the contact form</CardDescription>
        </CardHeader>
        <CardContent>
          {contactSubmissions && contactSubmissions.length > 0 ? (
            <div className="space-y-6">
              {contactSubmissions.map((submission: any) => (
                <div key={submission.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-lg">{submission.subject || 'Contact Inquiry'}</h3>
                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          Contact Form
                        </Badge>
                        <Badge className={getStatusColor(submission.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(submission.status)}
                            {submission.status}
                          </span>
                        </Badge>
                      </div>
                      {submission.service_category && (
                        <p className="text-sm text-muted-foreground mb-3">
                          Interest: {submission.service_category.replace('_', ' ')}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    {/* Client Information */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                        Contact Information
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{submission.clients?.name}</span>
                          <span className="text-muted-foreground">({submission.clients?.email})</span>
                        </div>
                        {submission.clients?.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{submission.clients.phone}</span>
                          </div>
                        )}
                        {submission.clients?.company && (
                          <div className="flex items-center gap-2 text-sm">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span>{submission.clients.company}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Submission Details */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                        Submission Details
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Submitted: {new Date(submission.created_at).toLocaleDateString()}</span>
                        </div>
                        {submission.service_category && (
                          <div className="flex items-center gap-2 text-sm">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <span>Service Interest: {submission.service_category.replace('_', ' ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="mb-4">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">
                      Message
                    </h4>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm leading-relaxed">{submission.message}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button size="sm" asChild>
                      <Link href={`/admin/contact-submissions/${submission.id}`}>
                        View Full Details <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    {submission.status === 'pending' && (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/contact-submissions/${submission.id}/edit`}>
                          Mark as Completed
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No contact submissions yet</h3>
              <p className="text-muted-foreground">
                Contact form submissions will appear here when people reach out through your contact page.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {contactError && (
        <Card className="mt-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">Error loading contact submissions: {contactError.message}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}