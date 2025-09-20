// app/admin/requests/page.tsx
export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DashboardHomeButton } from "@/components/admin-navigation/dashboard-home-button"
import { Button } from "@/components/ui/button"
import { FileText, User, Calendar, ArrowRight } from "lucide-react"
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

  return (
    <div className="container mx-auto px-4 py-8">
    <DashboardHomeButton />
    
    <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Service Requests</h1>
          <p className="text-muted-foreground mt-2">Manage and track all client service requests</p>
        </div>
      </div>

      {requests && requests.length > 0 ? (
        <div className="space-y-6">
          {requests.map((request: any) => (
            <Card key={request.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-lg">{request.title}</CardTitle>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {request.clients?.name || 'Unknown Client'}
                      </span>
                      {request.clients?.company && (
                        <span>• {request.clients.company}</span>
                      )}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(request.status)}>
                    {request.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Service Type</h4>
                    <p className="text-sm">{request.service_type}</p>
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
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No service requests yet</h3>
            <p className="text-muted-foreground">Service requests will appear here as clients submit them.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}