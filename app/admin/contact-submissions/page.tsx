// app/admin/contact-submissions/page.tsx - UPDATED VERSION
export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DashboardHomeButton } from "@/components/admin-navigation/dashboard-home-button"
import { Mail, Phone, Building, Calendar, MessageSquare, ArrowRight } from "lucide-react"
import Link from "next/link"

export default async function ContactSubmissions() {
  const adminUser = await requireAuth()
  const supabase = createServerClient()

  // Get contact submissions (from contact form)
  const { data: contactSubmissions, error: contactError } = await supabase
    .from("service_requests")
    .select(`
      *,
      clients (
        name,
        email,
        phone,
        company
      )
    `)
    .eq("request_source", "contact")
    .order("created_at", { ascending: false })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardHomeButton />
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contact Submissions</h1>
          <p className="text-muted-foreground mt-2">Review all contact form submissions</p>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Contact Submissions</p>
              <p className="text-3xl font-bold text-purple-600">{contactSubmissions?.length || 0}</p>
            </div>
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

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
                        <h3 className="font-medium text-lg">{submission.title || 'Contact Inquiry'}</h3>
                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          Contact Form
                        </Badge>
                        <Badge className={getStatusColor(submission.status)}>
                          {submission.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Interest: {submission.service_category}
                      </p>
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
                        <div className="flex items-center gap-2 text-sm">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span>Service Interest: {submission.service_category}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="mb-4">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">
                      Message
                    </h4>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm leading-relaxed">{submission.description}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button size="sm" asChild>
                      <Link href={`/admin/requests/${submission.id}`}>
                        View Full Details <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/clients/${submission.clients?.id || '#'}`}>
                        View Client Profile
                      </Link>
                    </Button>
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