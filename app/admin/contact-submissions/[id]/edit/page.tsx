// app/admin/contact-submissions/[id]/edit/page.tsx - Update contact submission status
import { useAdminAuth } from "@/components/providers/admin-auth-provider"
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"

export default function EditContactSubmission() {
  const params = useParams()
  const router = useRouter()
  const submissionId = params.id as string

  const [submission, setSubmission] = useState<any>(null)
  const [status, setStatus] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchSubmission()
  }, [submissionId])

  const fetchSubmission = async () => {
    try {
      const response = await fetch(`/api/admin/contact-submissions/${submissionId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch submission")
      }
      const data = await response.json()
      setSubmission(data)
      setStatus(data.status)
    } catch (error: any) {
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
      const response = await fetch(`/api/admin/contact-submissions/${submissionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error("Failed to update submission")
      }

      setSuccess("Submission status updated successfully!")
      
      // Redirect back to detail page after a short delay
      setTimeout(() => {
        router.push(`/admin/contact-submissions/${submissionId}`)
      }, 1500)

    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsSaving(false)
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

  if (!submission) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Submission not found</p>
            <Button variant="outline" asChild className="mt-4">
              <Link href="/admin/contact-submissions">Back to Submissions</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/contact-submissions/${submissionId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Details
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Update Submission Status</h1>
          <p className="text-muted-foreground mt-1">Change the status of this contact submission</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact Submission Status</CardTitle>
          <CardDescription>
            Submission: {submission.subject || 'Contact Inquiry'} by {submission.clients?.name}
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

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Current Status</label>
              <div className="mt-2 flex items-center gap-2">
                {submission.status === 'pending' ? (
                  <Clock className="h-4 w-4 text-yellow-600" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                <span className="capitalize">{submission.status}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Update Status</label>
              <Select value={status} onValueChange={setStatus} disabled={isSaving}>
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
                  <SelectItem value="completed">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Completed
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium text-sm mb-2">Status Descriptions:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li><strong>Pending:</strong> Submission received, awaiting response</li>
                <li><strong>Completed:</strong> Inquiry has been addressed and resolved</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t">
            <Button 
              onClick={handleSave} 
              disabled={isSaving || status === submission.status}
              className="flex-1"
            >
              {isSaving ? "Saving..." : "Update Status"}
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/admin/contact-submissions/${submissionId}`}>Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}