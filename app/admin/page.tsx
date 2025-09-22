// app/admin/page.tsx - FIXED VERSION WITH PROPER ERROR HANDLING
import { createServerClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, FileText, CreditCard, Briefcase, Clock, MessageSquare } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function AdminDashboard() {
  // Require authentication - this will redirect to login if not authenticated
  const adminUser = await requireAuth()
  
  const supabase = createServerClient()

  // Initialize stats with safe defaults
  let stats = [
    {
      title: "Total Clients",
      value: 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      href: "/admin/clients"
    },
    {
      title: "Service Requests",
      value: 0,
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
      href: "/admin/requests"
    },
    {
      title: "Contact Inquiries", 
      value: 0,
      icon: MessageSquare,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
      href: "/admin/contact-submissions"
    },
    {
      title: "Pending Requests",
      value: 0,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950",
      href: "/admin/requests"
    },
    {
      title: "Portfolio Projects",
      value: 0,
      icon: Briefcase,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-950",
      href: "/admin/portfolio"
    },
  ]

  let recentRequests: any[] = []
  let recentContactInquiries: any[] = []
  let hasDataIssues = false

  try {
    // Fetch all data in parallel with proper error handling
    const [
      clientsResult,
      serviceRequestsResult,
      contactInquiriesResult,
      pendingRequestsResult,
      portfolioResult
    ] = await Promise.allSettled([
      supabase.from("clients").select("*", { count: "exact", head: true }),
      supabase.from("service_requests").select("*", { count: "exact", head: true }),
      supabase.from("contact_inquiries").select("*", { count: "exact", head: true }),
      supabase.from("service_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("portfolio_projects").select("*", { count: "exact", head: true })
    ])

    // Update stats based on successful queries
    if (clientsResult.status === 'fulfilled' && !clientsResult.value.error) {
      stats[0].value = clientsResult.value.count || 0
    } else {
      hasDataIssues = true
    }

    if (serviceRequestsResult.status === 'fulfilled' && !serviceRequestsResult.value.error) {
      stats[1].value = serviceRequestsResult.value.count || 0
    } else {
      hasDataIssues = true
    }

    if (contactInquiriesResult.status === 'fulfilled' && !contactInquiriesResult.value.error) {
      stats[2].value = contactInquiriesResult.value.count || 0
    } else {
      hasDataIssues = true
    }

    if (pendingRequestsResult.status === 'fulfilled' && !pendingRequestsResult.value.error) {
      stats[3].value = pendingRequestsResult.value.count || 0
    } else {
      hasDataIssues = true
    }

    if (portfolioResult.status === 'fulfilled' && !portfolioResult.value.error) {
      stats[4].value = portfolioResult.value.count || 0
    } else {
      hasDataIssues = true
    }

    // Fetch recent data for display
    try {
      const { data: recentServiceRequests } = await supabase
        .from("service_requests")
        .select(`
          id,
          title,
          service_category,
          status,
          created_at,
          clients!inner (
            name,
            email
          )
        `)
        .order("created_at", { ascending: false })
        .limit(3)

      if (recentServiceRequests) {
        recentRequests = recentServiceRequests
      }
    } catch (error) {
      console.error("Error fetching recent service requests:", error)
    }

    try {
      const { data: recentContacts } = await supabase
        .from("contact_inquiries")
        .select(`
          id,
          subject,
          status,
          created_at,
          clients!inner (
            name,
            email
          )
        `)
        .order("created_at", { ascending: false })
        .limit(3)

      if (recentContacts) {
        recentContactInquiries = recentContacts
      }
    } catch (error) {
      console.error("Error fetching recent contact inquiries:", error)
    }

  } catch (error) {
    console.error("Critical dashboard error:", error)
    hasDataIssues = true
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {adminUser.name}! Here's what's happening at Kamisoft.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow cursor-pointer" asChild>
              <Link href={stat.href}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Access all administrative functions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-start bg-transparent">
              <Link href="/admin/requests">
                <FileText className="mr-2 h-4 w-4" />
                Manage Service Requests ({stats[1].value})
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start bg-transparent">
              <Link href="/admin/contact-submissions">
                <MessageSquare className="mr-2 h-4 w-4" />
                Contact Submissions ({stats[2].value})
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start bg-transparent">
              <Link href="/admin/clients">
                <Users className="mr-2 h-4 w-4" />
                View All Clients ({stats[0].value})
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start bg-transparent">
              <Link href="/admin/portfolio">
                <Briefcase className="mr-2 h-4 w-4" />
                Portfolio Management ({stats[4].value})
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Service Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Service Requests</CardTitle>
            <CardDescription>Latest hire us form submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentRequests.length > 0 ? (
              <div className="space-y-4">
                {recentRequests.map((request: any) => (
                  <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">{request.title || 'Untitled Request'}</h4>
                      <p className="text-sm text-muted-foreground truncate">{request.clients?.name || 'Unknown Client'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <Badge className={getStatusColor(request.status)}>{request.status.replace("_", " ")}</Badge>
                    </div>
                  </div>
                ))}
                <Button size="sm" variant="outline" className="w-full" asChild>
                  <Link href="/admin/requests">View All Requests</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No recent service requests</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Contact Inquiries */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Contact Inquiries</CardTitle>
            <CardDescription>Latest contact form submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentContactInquiries.length > 0 ? (
              <div className="space-y-4">
                {recentContactInquiries.map((inquiry: any) => (
                  <div key={inquiry.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">{inquiry.subject || 'Contact Inquiry'}</h4>
                      <p className="text-sm text-muted-foreground truncate">{inquiry.clients?.name || 'Unknown Client'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(inquiry.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <Badge className={getStatusColor(inquiry.status)}>{inquiry.status}</Badge>
                    </div>
                  </div>
                ))}
                <Button size="sm" variant="outline" className="w-full" asChild>
                  <Link href="/admin/contact-submissions">View All Inquiries</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No recent contact inquiries</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Database Setup Notice - Only show if there are actual issues */}
      {hasDataIssues && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950">
          <CardHeader>
            <CardTitle className="text-amber-800 dark:text-amber-200">Database Setup Required</CardTitle>
            <CardDescription className="text-amber-600 dark:text-amber-400">
              Some database tables need to be set up in Supabase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <p className="text-amber-700 dark:text-amber-300">
                To get the full dashboard experience, please run the database schema in your Supabase SQL editor.
              </p>
              <div className="space-y-2">
                <p className="font-medium text-amber-800 dark:text-amber-200">Required tables:</p>
                <ul className="list-disc list-inside text-amber-700 dark:text-amber-300 space-y-1">
                  <li>admin_users - for admin authentication</li>
                  <li>clients - for client management</li>
                  <li>service_requests - for hire us form submissions</li>
                  <li>contact_inquiries - for contact form submissions</li>
                  <li>portfolio_projects - for portfolio management</li>
                  <li>payments - for payment tracking</li>
                </ul>
              </div>
              <Button size="sm" variant="outline" asChild className="mt-4">
                <Link href="/api/debug/database" target="_blank">
                  Debug Database Status
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}