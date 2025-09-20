export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DashboardHomeButton } from "@/components/admin-navigation/dashboard-home-button"
import { Mail, Phone, Building, Calendar, MessageSquare } from "lucide-react"
import Link from "next/link"

export default async function ContactSubmissions() {
  const adminUser = await requireAuth()
  const supabase = createServerClient()

  // Get service requests (from hire us form)
  const { data: serviceRequests, error: requestsError } = await supabase
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
    .order("created_at", { ascending: false })

  // Get direct contact submissions (if you have a separate contacts table)
  // You may need to create this table for direct contact form submissions

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardHomeButton />
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contact Submissions</h1>
          <p className="text-muted-foreground mt-2">Review all contact form and hire us submissions</p>
        </div>
      </div>

      {/* Service Requests (Hire Us Form) */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Service Requests (Hire Us Form)</CardTitle>
          <CardDescription>Submissions from the hire us form</CardDescription>
        </CardHeader>
        <CardContent>
          {serviceRequests && serviceRequests.length > 0 ? (
            <div className="space-y-4">
              {serviceRequests.map((request: any) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-lg">{request.title}</h3>
                      <p className="text-sm text-muted-foreground">{request.service_type}</p>
                    </div>
                    <Badge variant={request.status === 'pending' ? 'secondary' : 'default'}>
                      {request.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4" />
                        <span>{request.clients?.name}</span>
                        <span className="text-muted-foreground">({request.clients?.email})</span>
                      </div>
                      {request.clients?.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4" />
                          <span>{request.clients.phone}</span>
                        </div>
                      )}
                      {request.clients?.company && (
                        <div className="flex items-center gap-2 text-sm">
                          <Building className="h-4 w-4" />
                          <span>{request.clients.company}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        <span>Submitted: {new Date(request.created_at).toLocaleDateString()}</span>
                      </div>
                      {request.preferred_date && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4" />
                          <span>Preferred: {new Date(request.preferred_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm font-medium mb-1">Description:</p>
                    <p className="text-sm text-muted-foreground">{request.description}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" asChild>
                      <Link href={`/admin/requests/${request.id}`}>View Details</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No service requests found</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}