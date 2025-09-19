// app/admin/requests/page.tsx
export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Mail, Phone, Calendar, DollarSign } from "lucide-react"
import Link from "next/link"

export default async function ServiceRequestsPage() {
  // Require authentication
  await requireAuth()
  
  const supabase = createServerClient()

  const { data: requests, error } = await supabase
    .from("service_requests")
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Service Requests</h1>
          <p className="text-muted-foreground mt-2">Manage all client service requests</p>
        </div>
      </div>

      {requests && requests.length > 0 ? (
        <div className="space-y-6">
          {requests.map((request: any) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{request.title}</CardTitle>
                    <CardDescription className="mt-2">
                      Client: {request.clients?.name} • {request.service_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(request.status)}>
                    {request.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">{request.description}</p>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {request.clients?.email}
                    </div>
                    
                    {request.clients?.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {request.clients?.phone}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Created: {new Date(request.created_at).toLocaleDateString()}
                    </div>
                    
                    {request.estimated_cost && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        Estimated: ${request.estimated_cost}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col justify-between">
                    <div className="space-y-2">
                      {request.preferred_date && (
                        <p className="text-sm">
                          <strong>Preferred Date:</strong> {new Date(request.preferred_date).toLocaleDateString()}
                        </p>
                      )}
                      
                      {request.site_address && (
                        <p className="text-sm">
                          <strong>Site Address:</strong> {request.site_address}
                        </p>
                      )}
                      
                      <p className="text-sm">
                        <strong>Request Type:</strong> {request.request_type.replace('_', ' ')}
                      </p>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" asChild>
                        <Link href={`/admin/requests/${request.id}`}>View Details</Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/clients/${request.clients?.id}`}>View Client</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No service requests yet</h3>
            <p className="text-muted-foreground">Service requests will appear here as clients submit them.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}