// app/admin/requests/page.tsx - FIXED VERSION
export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DashboardHomeButton } from "@/components/admin-navigation/dashboard-home-button"
import { Button } from "@/components/ui/button"
import { FileText, User, Calendar, ArrowRight, MessageSquare } from "lucide-react"
import Link from "next/link"

export default async function RequestsPage() {
  // Require authentication
  const adminUser = await requireAuth()
  
  const supabase = createServerClient()

  const { data: requests, error } = await supabase
    .from("service_requests")
    .select(`
      *,
      clients (
        id,
        name,
        email,
        company
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching requests:", error)
  }

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

  const getSourceColor = (source: string) => {
    switch (source) {
      case "hire_us":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "contact":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  // Separate requests by source
  const hireUsRequests = requests?.filter(req => req.request_source === 'hire_us') || []
  const contactRequests = requests?.filter(req => req.request_source === 'contact') || []

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardHomeButton />
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Service Requests</h1>
          <p className="text-muted-foreground mt-2">Manage and track all client service requests</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold text-foreground">{requests?.length || 0}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Service Requests</p>
                <p className="text-2xl font-bold text-blue-600">{hireUsRequests.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contact Inquiries</p>
                <p className="text-2xl font-bold text-purple-600">{contactRequests.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Requests (Hire Us) */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Service Requests ({hireUsRequests.length})
          </CardTitle>
          <CardDescription>Requests from the "Hire Us" form</CardDescription>
        </CardHeader>
        <CardContent>
          {hireUsRequests.length > 0 ? (
            <div className="space-y-6">
              {hireUsRequests.map((request: any) => (
                <Card key={request.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium text-lg">{request.title || 'Untitled Request'}</h3>
                          <Badge className={getSourceColor(request.request_source)}>
                            Service Request
                          </Badge>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {request.clients?.name || 'Unknown Client'}
                          </span>
                          {request.clients?.company && (
                            <span>• {request.clients.company}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Service Category</h4>
                        <p className="text-sm">{request.service_category}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Description</h4>
                        <p className="text-sm line-clamp-2">{request.description}</p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Created: {new Date(request.created_at).toLocaleDateString()}
                          </span>
                          {request.preferred_date && (
                            <span>
                              Preferred: {new Date(request.preferred_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/admin/requests/${request.id}`}>
                            View Details <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No service requests yet</h3>
              <p className="text-muted-foreground">Service requests from the hire us form will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Inquiries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Contact Inquiries ({contactRequests.length})
          </CardTitle>
          <CardDescription>Inquiries from the contact form</CardDescription>
        </CardHeader>
        <CardContent>
          {contactRequests.length > 0 ? (
            <div className="space-y-6">
              {contactRequests.map((request: any) => (
                <Card key={request.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium text-lg">{request.title || 'Contact Inquiry'}</h3>
                          <Badge className={getSourceColor(request.request_source)}>
                            Contact Inquiry
                          </Badge>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {request.clients?.name || 'Unknown Client'}
                          </span>
                          {request.clients?.company && (
                            <span>• {request.clients.company}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Interest Area</h4>
                        <p className="text-sm">{request.service_category}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Message</h4>
                        <p className="text-sm line-clamp-2">{request.description}</p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Received: {new Date(request.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/admin/requests/${request.id}`}>
                            View Details <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No contact inquiries yet</h3>
              <p className="text-muted-foreground">Contact form submissions will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}