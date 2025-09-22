// app/admin/requests/[id]/edit/page.tsx - FIXED VERSION WITH CORRECT API CALLS
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, CheckCircle, Clock, FileText, XCircle } from "lucide-react"
import Link from "next/link"

export default function EditServiceRequest() {
  const params = useParams()
  const router = useRouter()
  const requestId = params.id as string

  const [request, setRequest] = useState<any>(null)
  const [formData, setFormData] = useState({
    status: "",
    priority: "",
    estimated_cost: "",
    requirements: "",
    timeline: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchRequest()
  }, [requestId])

  const fetchRequest = async () => {
    try {
      const response = await fetch(`/api/service-requests/${requestId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch request")
      }
      const data = await response.json()
      setRequest(data)
      setFormData({
        status: data.status || "",
        priority: data.priority || "medium",
        estimated_cost: data.estimated_cost?.toString() || "",
        requirements: data.requirements || "",
        timeline: data.timeline || "",
      })
    } catch (error: any) {
      console.error("Error fetching request:", error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError("")
    setSuccess("")

    try {
      const updateData = {
        ...formData,
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
      }

      const response = await fetch(`/api/service-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update request")
      }

      setSuccess("Service request updated successfully!")
      
      // Redirect back to detail page after a short delay
      setTimeout(() => {
        router.push(`/admin/requests/${requestId}`)
      }, 1500)

    } catch (error: any) {
      console.error("Error updating request:", error)
      setError(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "in_progress":
        return <FileText className="h-4 w-4 text-blue-600" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "declined":
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Service request not found</p>
            <Button variant="outline" asChild className="mt-4">
              <Link href="/admin/requests">Back to Requests</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/requests/${requestId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Details
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Update Service Request</h1>
          <p className="text-muted-foreground mt-1">Manage status and project details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
              <CardDescription>
                {request.title} by {request.clients?.name || 'Unknown Client'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData({...formData, status: value})}
                    disabled={isSaving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-yellow-600" />
                          Pending
                        </div>
                      </SelectItem>
                      <SelectItem value="in_progress">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          In Progress
                        </div>
                      </SelectItem>
                      <SelectItem value="completed">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Completed
                        </div>
                      </SelectItem>
                      <SelectItem value="approved">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-gray-600" />
                          Approved
                        </div>
                      </SelectItem>
                      <SelectItem value="declined">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          Declined
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(value) => setFormData({...formData, priority: value})}
                    disabled={isSaving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimated_cost">Estimated Cost (USD)</Label>
                  <Input
                    id="estimated_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.estimated_cost}
                    onChange={(e) => setFormData({...formData, estimated_cost: e.target.value})}
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeline">Timeline</Label>
                  <Input
                    id="timeline"
                    placeholder="e.g., 4-6 weeks"
                    value={formData.timeline}
                    onChange={(e) => setFormData({...formData, timeline: e.target.value})}
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Additional Requirements</Label>
                <Textarea
                  id="requirements"
                  placeholder="Add any additional requirements or notes..."
                  rows={4}
                  value={formData.requirements}
                  onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                  disabled={isSaving}
                />
              </div>

              <div className="flex gap-4 pt-6 border-t">
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving || !formData.status}
                  className="flex-1"
                >
                  {isSaving ? "Saving..." : "Update Request"}
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/admin/requests/${requestId}`}>Cancel</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                {getStatusIcon(request.status)}
                <span className="capitalize font-medium">{request.status.replace('_', ' ')}</span>
              </div>
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Priority:</strong> {request.priority || 'Medium'}</p>
                <p><strong>Type:</strong> {request.request_type === 'digital' ? 'Digital/Remote' : 'On-Site'}</p>
                <p><strong>Category:</strong> {request.service_category?.replace('_', ' ')}</p>
                {request.estimated_cost && (
                  <p><strong>Current Cost:</strong> ${request.estimated_cost.toLocaleString()}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="flex items-center gap-2 font-medium">
                    <Clock className="h-3 w-3 text-yellow-600" />
                    Pending
                  </div>
                  <p className="text-muted-foreground">New request awaiting review</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 font-medium">
                    <FileText className="h-3 w-3 text-blue-600" />
                    In Progress
                  </div>
                  <p className="text-muted-foreground">Work has started on the project</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 font-medium">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Approved
                  </div>
                  <p className="text-muted-foreground">Request approved, ready to start</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 font-medium">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Completed
                  </div>
                  <p className="text-muted-foreground">Project delivered successfully</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 font-medium">
                    <XCircle className="h-3 w-3 text-red-600" />
                    Declined
                  </div>
                  <p className="text-muted-foreground">Request was declined</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}