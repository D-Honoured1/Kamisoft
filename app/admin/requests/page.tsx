import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Calendar, MapPin, Mail, Phone } from "lucide-react"
import Link from "next/link"

export default async function ServiceRequestsManagement() {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  let requests = null
  let error = null

  try {
    const result = await supabase
      .from("service_requests")
      .select(`
        *,
        clients (
          name,
          email,
          phone
        )
      `)
      .order("created_at", { ascending: false })

    requests = result.data
    error = result.error
  } catch (dbError) {
    console.error("Database connection error:", dbError)
    error = dbError
  }

  if (error) {
    console.error("Error fetching service requests:", error)
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive">Unable to load service requests. Please try again later.</p>
        </div>
      </div>
    )
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Service Requests</h1>
          <p className="text-muted-foreground mt-2">Manage client service requests and assignments</p>
        </div>
      </div>

      {requests && requests.length > 0 ? (
        <div className="space-y-6">
          {requests.map((request: any) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{request.service_type}</CardTitle>
                    <CardDescription className="mt-1">
                      Request #{request.id.slice(0, 8)} • {request.clients?.name}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(request.priority)}>{request.priority} priority</Badge>
                    <Badge className={getStatusColor(request.status)}>{request.status.replace("_", " ")}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {request.clients?.email}
                  </div>
                  {request.clients?.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {request.clients.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(request.created_at).toLocaleDateString()}
                  </div>
                  {request.service_location === "on_site" && request.address && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      On-site service
                    </div>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{request.description}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {request.estimated_cost && (
                      <span className="text-sm font-medium text-foreground">
                        Est. Cost: ${request.estimated_cost.toLocaleString()}
                      </span>
                    )}
                    {request.service_location === "on_site" && request.preferred_date && (
                      <span className="text-sm text-muted-foreground">
                        Preferred: {new Date(request.preferred_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <Button size="sm" asChild>
                    <Link href={`/admin/requests/${request.id}`}>
                      <Eye className="mr-2 h-3 w-3" />
                      View Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium text-foreground mb-2">No service requests yet</h3>
            <p className="text-muted-foreground">Service requests from clients will appear here.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
