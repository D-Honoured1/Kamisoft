// app/admin/clients/page.tsx - FIXED VERSION WITH CONTACT INQUIRIES
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardHomeButton } from "@/components/admin-navigation/dashboard-home-button"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Phone, FileText, Search, Filter, Users, MessageSquare } from "lucide-react"
import Link from "next/link"

interface Client {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  created_at: string
  service_requests: Array<{
    id: string
    request_source: 'hire_us'
    status: string
    service_category: string
    created_at: string
  }>
  contact_inquiries: Array<{
    id: string
    status: string
    subject: string
    created_at: string
  }>
}

export default function ClientsManagement() {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all") // all, service_only, contact_only
  const [sortBy, setSortBy] = useState("newest") // newest, oldest, name

  useEffect(() => {
    fetchClients()
  }, [])

  useEffect(() => {
    filterAndSortClients()
  }, [clients, searchTerm, filterType, sortBy])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/admin/clients')
      if (!response.ok) {
        throw new Error('Failed to fetch clients')
      }
      const data = await response.json()
      setClients(data.clients || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load clients')
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortClients = () => {
    let filtered = [...clients]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Apply type filter
    if (filterType !== "all") {
      filtered = filtered.filter(client => {
        const hasServiceRequests = client.service_requests?.length > 0
        const hasContactInquiries = client.contact_inquiries?.length > 0
        
        switch (filterType) {
          case "service_only":
            return hasServiceRequests && !hasContactInquiries
          case "contact_only":
            return hasContactInquiries && !hasServiceRequests
          default:
            return true
        }
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "name":
          return a.name.localeCompare(b.name)
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    setFilteredClients(filtered)
  }

  const getClientType = (client: Client) => {
    const hasServiceRequests = client.service_requests?.length > 0
    const hasContactInquiries = client.contact_inquiries?.length > 0
    
    if (hasServiceRequests && hasContactInquiries) return "both"
    if (hasServiceRequests) return "service"
    if (hasContactInquiries) return "contact"
    return "none"
  }

  const getTypeDisplay = (type: string) => {
    switch (type) {
      case "service":
        return { label: "Service Client", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", icon: FileText }
      case "contact":
        return { label: "Contact Only", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", icon: MessageSquare }
      case "both":
        return { label: "Service + Contact", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", icon: Users }
      default:
        return { label: "No Requests", color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200", icon: Users }
    }
  }

  const getClientDetailUrl = (client: Client) => {
    const hasServiceRequests = client.service_requests?.length > 0
    const hasContactInquiries = client.contact_inquiries?.length > 0
    
    if (hasServiceRequests) {
      // Redirect to latest service request
      const latestRequest = client.service_requests[0]
      return `/admin/requests/${latestRequest.id}`
    } else if (hasContactInquiries) {
      // Redirect to latest contact inquiry
      const latestInquiry = client.contact_inquiries[0]
      return `/admin/contact-submissions/${latestInquiry.id}`
    } else {
      // Fallback to client profile (if it exists)
      return `/admin/clients/${client.id}`
    }
  }

  const stats = {
    total: clients.length,
    serviceOnly: clients.filter(c => getClientType(c) === "service").length,
    contactOnly: clients.filter(c => getClientType(c) === "contact").length,
    both: clients.filter(c => getClientType(c) === "both").length,
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <DashboardHomeButton />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardHomeButton />
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Client Management</h1>
          <p className="text-muted-foreground mt-2">View and manage your client database</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Service Clients</p>
                <p className="text-2xl font-bold">{stats.serviceOnly}</p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contact Only</p>
                <p className="text-2xl font-bold">{stats.contactOnly}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  <SelectItem value="service_only">Service Clients Only</SelectItem>
                  <SelectItem value="contact_only">Contact Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          Showing {filteredClients.length} of {clients.length} clients
        </p>
      </div>

      {filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => {
            const clientType = getClientType(client)
            const typeDisplay = getTypeDisplay(clientType)
            const Icon = typeDisplay.icon
            const detailUrl = getClientDetailUrl(client)
            
            return (
              <Card key={client.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{client.name}</CardTitle>
                      <CardDescription>
                        Client since {new Date(client.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge className={typeDisplay.color}>
                      <Icon className="w-3 h-3 mr-1" />
                      {typeDisplay.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {client.phone}
                      </div>
                    )}
                    {client.company && (
                      <div className="text-sm text-muted-foreground">
                        <strong>Company:</strong> {client.company}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Service Requests:</span>
                      <span className="font-medium">
                        {client.service_requests?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Contact Inquiries:</span>
                      <span className="font-medium">
                        {client.contact_inquiries?.length || 0}
                      </span>
                    </div>
                  </div>

                  <Button size="sm" variant="outline" className="w-full" asChild>
                    <Link href={detailUrl}>View Details</Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium text-foreground mb-2">
              {clients.length === 0 ? "No clients yet" : "No clients match your filters"}
            </h3>
            <p className="text-muted-foreground">
              {clients.length === 0 
                ? "Client information will appear here as they submit requests." 
                : "Try adjusting your search terms or filters."}
            </p>
            {filteredClients.length === 0 && clients.length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("")
                  setFilterType("all")
                }} 
                className="mt-4"
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}