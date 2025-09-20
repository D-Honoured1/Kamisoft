// app/admin/page.tsx - FIXED VERSION WITH BETTER ERROR HANDLING
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

  // Initialize default stats
  let stats = [
    {
      title: "Total Clients",
      value: 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Service Requests",
      value: 0,
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "Pending Requests",
      value: 0,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950",
    },
    {
      title: "Total Payments",
      value: 0,
      icon: CreditCard,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      title: "Portfolio Projects",
      value: 0,
      icon: Briefcase,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-950",
    },
  ]

  let recentRequests = null
  let errorMessages: string[] = []

  try {
    // Try to fetch data with better error handling
    console.log("Fetching dashboard data...")

    // Fetch clients count
    let totalClients = 0
    try {
      const { count, error } = await supabase.from("clients").select("*", { count: "exact", head: true })
      if (error) {
        console.error("Error fetching clients:", error)
        errorMessages.push("Could not load clients data")
      } else {
        totalClients = count || 0
      }
    } catch (err) {
      console.error("Clients query failed:", err)
      errorMessages.push("Clients table query failed")
    }

    // Fetch service requests count
    let totalRequests = 0
    let pendingRequests = 0
    try {
      const [totalResult, pendingResult] = await Promise.all([
        supabase.from("service_requests").select("*", { count: "exact", head: true }),
        supabase.from("service_requests").select("*", { count: "exact", head: true }).eq("status", "pending")
      ])

      if (totalResult.error) {
        console.error("Error fetching service requests:", totalResult.error)
        errorMessages.push("Could not load service requests data")
      } else {
        totalRequests = totalResult.count || 0
      }

      if (pendingResult.error) {
        console.error("Error fetching pending requests:", pendingResult.error)
        errorMessages.push("Could not load pending requests data")
      } else {
        pendingRequests = pendingResult.count || 0
      }
    } catch (err) {
      console.error("Service requests query failed:", err)
      errorMessages.push("Service requests table query failed")
    }

    // Fetch payments count
    let totalPayments = 0
    try {
      const { count, error } = await supabase.from("payments").select("*", { count: "exact", head: true })
      if (error) {
        console.error("Error fetching payments:", error)
        errorMessages.push("Could not load payments data")
      } else {
        totalPayments = count || 0
      }
    } catch (err) {
      console.error("Payments query failed:", err)
      errorMessages.push("Payments table query failed")
    }

    // Fetch portfolio projects count
    let portfolioProjects = 0
    try {
      const { count, error } = await supabase.from("portfolio_projects").select("*", { count: "exact", head: true })
      if (error) {
        console.error("Error fetching portfolio projects:", error)
        errorMessages.push("Could not load portfolio projects data")
      } else {
        portfolioProjects = count || 0
      }
    } catch (err) {
      console.error("Portfolio projects query failed:", err)
      errorMessages.push("Portfolio projects table query failed")
    }

    // Fetch recent requests with better error handling
    try {
      const { data: fetchedRecentRequests, error: requestsError } = await supabase
        .from("service_requests")
        .select(`
          id,
          title,
          service_type,
          status,
          created_at,
          client_id,
          clients!inner (
            name,
            email
          )
        `)
        .order("created_at", { ascending: false })
        .limit(5)

      if (requestsError) {
        console.error("Error fetching recent requests:", requestsError)
        errorMessages.push("Could not load recent requests")
      } else {
        recentRequests = fetchedRecentRequests
      }
    } catch (err) {
      console.error("Recent requests query failed:", err)
      errorMessages.push("Recent requests query failed")
    }

    // Update stats with fetched data
    stats = [
      {
        title: "Total Clients",
        value: totalClients,
        icon: Users,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950",
      },
      {
        title: "Service Requests",
        value: totalRequests,
        icon: FileText,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950",
      },
      {
        title: "Pending Requests",
        value: pendingRequests,
        icon: Clock,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50 dark:bg-yellow-950",
      },
      {
        title: "Total Payments",
        value: totalPayments,
        icon: CreditCard,
        color: "text-purple-600",
        bgColor: "bg-purple-50 dark:bg-purple-950",
      },
      {
        title: "Portfolio Projects",
        value: portfolioProjects,
        icon: Briefcase,
        color: "text-indigo-600",
        bgColor: "bg-indigo-50 dark:bg-indigo-950",
      },
    ]

    console.log("Dashboard data loaded successfully")

  } catch (error) {
    console.error("Critical dashboard error:", error)
    errorMessages.push("Critical error loading dashboard data")
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
      {/* Header with Error Messages */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {adminUser.name}! Here's what's happening at Kamisoft.
        </p>
        
        {errorMessages.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
            <h4 className="font-medium text-yellow-800">Dashboard Warnings:</h4>
            <ul className="mt-2 text-sm text-yellow-700">
              {errorMessages.map((msg, index) => (
                <li key={index}>• {msg}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
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
              <Link href="/admin/clients">
                <Users className="mr-2 h-4 w-4" />
                View All Clients ({stats[0].value})
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start bg-transparent">
             <Link href="/admin/contact-submissions">
              <MessageSquare className="mr-2 h-4 w-4" />
               Contact Submissions
             </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start bg-transparent">
              <Link href="/admin/payments">
                <CreditCard className="mr-2 h-4 w-4" />
                Payment History ({stats[3].value})
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
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Service Requests</CardTitle>
            <CardDescription>Latest client requests and their status</CardDescription>
          </CardHeader>
          <CardContent>
            {recentRequests && recentRequests.length > 0 ? (
              <div className="space-y-4">
                {recentRequests.map((request: any) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{request.title || 'Untitled Request'}</h4>
                      <p className="text-sm text-muted-foreground">{request.clients?.name || 'Unknown Client'}</p>
                      <p className="text-sm text-muted-foreground">{request.service_type}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(request.status)}>{request.status.replace("_", " ")}</Badge>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/requests/${request.id}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {errorMessages.includes("Could not load recent requests") 
                    ? "Unable to load recent requests due to database issues"
                    : "No recent requests"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Database Status Section */}
      {errorMessages.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Database Status</CardTitle>
            <CardDescription className="text-yellow-600">
              Some database tables may need to be set up or have schema issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-yellow-800">Tables that may need attention:</p>
              <ul className="list-disc list-inside text-yellow-700">
                {errorMessages.map((msg, index) => (
                  <li key={index}>{msg}</li>
                ))}
              </ul>
              <p className="mt-4 text-yellow-600">
                Check your Supabase dashboard to ensure all tables exist with the correct schemas.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}