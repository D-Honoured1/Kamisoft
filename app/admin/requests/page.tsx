// app/admin/requests/page.tsx - FIXED VERSION (HIRE US ONLY)
export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DashboardHomeButton } from "@/components/admin-navigation/dashboard-home-button"
import { Button } from "@/components/ui/button"
import { FileText, User, Calendar, ArrowRight, Clock, CheckCircle, XCircle } from "lucide-react"
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

  // Updated Status Helper Functions - Replace in your components

 const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    case "approved":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" // Changed from green to gray
    case "in_progress":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    case "declined":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending":
      return <Clock className="h-4 w-4" />
    case "approved":
      return <CheckCircle className="h-4 w-4" /> // Still uses check circle but with gray color
    case "in_progress":
      return <FileText className="h-4 w-4" />
    case "completed":
      return <CheckCircle className="h-4 w-4" />
    case "declined":
      return <XCircle className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

  // Calculate stats
  const totalRequests = requests?.length || 0
  const pendingRequests = requests?.filter(req => req.status === 'pending').length || 0
  const approvedRequests = requests?.filter(req => req.status === 'approved').length || 0
  const inProgressRequests = requests?.filter(req => req.status === 'in_progress').length || 0
  const completedRequests = requests?.filter(req => req.status === 'completed').length || 0

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardHomeButton />
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Service Requests</h1>
          <p className="text-muted-foreground mt-2">Manage all hire us form submissions</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold text-foreground">{totalRequests}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingRequests}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">{approvedRequests}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{inProgressRequests}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedRequests}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Requests List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Service Requests ({totalRequests})
          </CardTitle>
          <CardDescription>All requests from the "Hire Us" form</CardDescription>
        </CardHeader>
        <CardContent>
          {requests && requests.length > 0 ? (
            <div className="space-y-6">
              {requests.map((request: any) => (
                <Card key={request.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium text-lg">{request.title || 'Untitled Request'}</h3>
                          <Badge className={getStatusColor(request.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(request.status)}
                              {request.status.replace("_", " ")}
                            </span>
                          </Badge>
                          {request.priority && request.priority !== 'medium' && (
                            <Badge variant="outline" className={
                              request.priority === 'high' ? 'border-red-500 text-red-700' : 
                              request.priority === 'low' ? 'border-gray-500 text-gray-700' : ''
                            }>
                              {request.priority} priority
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {request.clients?.name || 'Unknown Client'}
                          </span>
                          {request.clients?.company && (
                            <span>• {request.clients.company}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${
                              request.request_type === 'digital' ? 'bg-blue-500' : 'bg-orange-500'
                            }`}></span>
                            {request.request_type === 'digital' ? 'Digital/Remote' : 'On-Site'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Service Category</h4>
                        <Badge variant="secondary">{request.service_category.replace('_', ' ')}</Badge>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Description</h4>
                        <p className="text-sm line-clamp-2">{request.description}</p>
                      </div>

                      {request.estimated_cost && (
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">Estimated Cost</h4>
                          <p className="text-sm font-medium">${request.estimated_cost.toLocaleString()}</p>
                        </div>
                      )}

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
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/admin/requests/${request.id}`}>
                              View Details <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No service requests yet</h3>
              <p className="text-muted-foreground">Service requests from the hire us form will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}