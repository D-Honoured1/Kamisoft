// app/admin/contact-submissions/[id]/page.tsx - Detail page for contact submissions
export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server-auth"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Mail, Phone, Building, ArrowLeft, MessageSquare, User, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"

interface ContactSubmissionDetailProps {
  params: {
    id: string
  }
}

export default async function ContactSubmissionDetail({ params }: ContactSubmissionDetailProps) {
  const adminUser = await requireAuth()
  const supabase = createServerClient()

  const { data: submission, error } = await supabase
    .from("contact_inquiries")
    .select(`
      *,
      clients (
        id,
        name,
        email,
        phone,
        company
      )
    `)
    .eq("id", params.id)
    .single()

  if (error || !submission) {
    notFound()
  }

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contact Submission Details</h1>
          <p className="text-muted-foreground mt-2">Submission #{submission.id.slice(0, 8)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/contact-submissions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Submissions
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Submission Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    {submission.subject || 'Contact Inquiry'}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Submitted via Contact form on {new Date(submission.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    Contact Inquiry
                  </Badge>
                  <Badge className={getStatusColor(submission.status)}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(submission.status)}
                      {submission.status}
                    </span>
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {submission.service_category && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Service Interest</h4>
                    <Badge variant="secondary">{submission.service_category.replace('_', ' ')}</Badge>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-foreground mb-2">Message</h4>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{submission.message}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">{submission.clients.name}</p>
                    {submission.clients.company && (
                      <p className="text-sm text-muted-foreground">{submission.clients.company}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="text-muted-foreground">{submission.clients.email}</p>
                </div>
                {submission.clients.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className="text-muted-foreground">{submission.clients.phone}</p>
                  </div>
                )}
              </div>
              <div className="pt-4 border-t mt-4">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/admin/clients/${submission.clients?.id || '#'}`}>
                    View Client Profile
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Submission Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Submitted</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(submission.created_at).toLocaleDateString()} at {new Date(submission.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                {submission.updated_at !== submission.created_at && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Last Updated</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(submission.updated_at).toLocaleDateString()} at {new Date(submission.updated_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {submission.status === 'pending' ? (
                  <Button className="w-full" asChild>
                    <Link href={`/admin/contact-submissions/${submission.id}/edit`}>
                      Mark as Completed
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/admin/contact-submissions/${submission.id}/edit`}>
                      Update Status
                    </Link>
                  </Button>
                )}
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`mailto:${submission.clients.email}?subject=Re: ${submission.subject || 'Your Contact Inquiry'}`}>
                    Reply via Email
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}