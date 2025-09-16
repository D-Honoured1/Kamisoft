import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, FileText, CreditCard, Briefcase, Clock } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function AdminDashboard() {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  // Fetch dashboard statistics
  const [
    { count: totalClients },
    { count: totalRequests },
    { count: pendingRequests },
    { count: totalPayments },
    { count: portfolioProjects },
  ] = await Promise.all([
    supabase.from("clients").select("*", { count: "exact", head: true }),
    supabase.from("service_requests").select("*", { count: "exact", head: true }),
    supabase.from("service_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("payments").select("*", { count: "exact", head: true }),
    supabase.from("portfolio_projects").select("*", { count: "exact", head: true }),
  ])

  // Fetch recent requests
  const { data: recentRequests } = await supabase
    .from("service_requests")
    .select(`
      *,
      clients (
        name,
        email
      )
    `)
    .order("created_at", { ascending: false })
    .limit(5)

  const stats = [
    {
      title: "Total Clients",
      value: totalClients || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Service Requests",
      value: totalRequests || 0,
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "Pending Requests",
      value: pendingRequests || 0,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950",
    },
    {
      title: "Total Payments",
      value: totalPayments || 0,
      icon: CreditCard,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      title: "Portfolio Projects",
      value: portfolioProjects || 0,
      icon: Briefcase,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-950",
    },
  ]

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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">Welcome back! Here's what's happening at Kamisoft.</p>
          </div>
          <div className="flex gap-4">
            <Button asChild>
              <Link href="/admin/portfolio/new">Add Project</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">View Site</Link>
            </Button>
          </div>
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start">
                <Link href="/admin/requests">
                  <FileText className="mr-2 h-4 w-4" />
                  Manage Requests
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                <Link href="/admin/clients">
                  <Users className="mr-2 h-4 w-4" />
                  View Clients
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                <Link href="/admin/payments">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Payment History
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                <Link href="/admin/portfolio">
                  <Briefcase className="mr-2 h-4 w-4" />
                  Portfolio Management
                </Link>
              </Button>
            </CardContent>
          </Card>

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
                        <h4 className="font-medium text-foreground">{request.clients?.name}</h4>
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
                <p className="text-muted-foreground text-center py-8">No recent requests</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
