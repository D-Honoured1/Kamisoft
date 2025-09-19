// app/request-service/page.tsx - COMPLETE FIXED VERSION
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Briefcase, Mail, Phone, Building, Calendar, AlertTriangle } from "lucide-react"
import { SERVICE_CATEGORIES } from "@/lib/constants/services"

export default function RequestServicePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    service_category: "",
    request_type: "digital",
    title: "",
    description: "",
    preferred_date: "",
    site_address: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      console.log("Submitting form data:", formData)

      // FIXED: Use the correct API endpoint (plural)
      const res = await fetch("/api/service-requests", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(formData),
      })

      console.log("Response status:", res.status)
      
      if (!res.ok) {
        const errorData = await res.text()
        console.error("Server error response:", errorData)
        throw new Error(`Server error: ${res.status} ${res.statusText}`)
      }

      const data = await res.json()
      console.log("Success response:", data)
      
      setIsSubmitted(true)
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        service_category: "",
        request_type: "digital",
        title: "",
        description: "",
        preferred_date: "",
        site_address: "",
      })
    } catch (error: any) {
      console.error("Form submission error:", error)
      setError(error.message || "An unexpected error occurred while submitting your request.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="container max-w-2xl mx-auto">
          <Card className="text-center border-2 border-green-200 shadow-lg">
            <CardHeader className="pb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">Request Submitted Successfully!</CardTitle>
              <CardDescription className="text-lg mt-2">
                Thank you for choosing Kamisoft Enterprises
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We've received your service request and our team will review it shortly. 
                You can expect to hear from us within 24 hours.
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium text-foreground mb-2">What's Next?</h4>
                <ul className="text-sm text-muted-foreground space-y-1 text-left">
                  <li>• Our team will review your requirements</li>
                  <li>• We'll contact you to discuss project details</li>
                  <li>• You'll receive a detailed proposal and timeline</li>
                  <li>• We'll schedule a consultation call if needed</li>
                </ul>
              </div>
              <div className="pt-4">
                <Button 
                  onClick={() => setIsSubmitted(false)}
                  variant="outline"
                  className="mr-4"
                >
                  Submit Another Request
                </Button>
                <Button asChild>
                  <a href="/">Return to Homepage</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Hire Us for Your Next Project</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ready to transform your ideas into reality? Tell us about your project and we'll get back to you 
            with a customized solution within 24 hours.
          </p>
        </div>

        {/* Centered Form Card */}
        <div className="flex justify-center">
          <Card className="w-full max-w-3xl border-2 shadow-lg">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-2xl">Project Request Form</CardTitle>
              <CardDescription>
                Fill out the details below and our team will reach out to discuss your project
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="border-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="font-medium">
                      {error}
                      <div className="text-sm mt-2 opacity-90">
                        If this problem persists, please contact us directly at hello@kamisoftenterprises.online
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Contact Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                        required
                        disabled={isLoading}
                        className="border-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                        required
                        disabled={isLoading}
                        className="border-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        <Phone className="h-4 w-4 inline mr-1" />
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                        disabled={isLoading}
                        className="border-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company">
                        <Building className="h-4 w-4 inline mr-1" />
                        Company/Organization
                      </Label>
                      <Input
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Your Company Name"
                        disabled={isLoading}
                        className="border-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Project Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Project Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="service_category">Service Category *</Label>
                      <Select
                        value={formData.service_category}
                        onValueChange={(value) => setFormData({ ...formData, service_category: value })}
                        required
                        disabled={isLoading}
                      >
                        <SelectTrigger className="border-2">
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(SERVICE_CATEGORIES).map(([key, category]) => (
                            <SelectItem key={key} value={key}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Request Type *</Label>
                      <RadioGroup
                        value={formData.request_type}
                        onValueChange={(value) => setFormData({ ...formData, request_type: value })}
                        className="flex gap-6 mt-2"
                        disabled={isLoading}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="digital" id="digital" disabled={isLoading} />
                          <Label htmlFor="digital">Digital/Remote</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="on_site" id="on_site" disabled={isLoading} />
                          <Label htmlFor="on_site">On-site</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Project Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="E.g., E-commerce Platform Development"
                      required
                      disabled={isLoading}
                      className="border-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Project Description *</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe your project requirements, goals, and any specific features you need..."
                      rows={5}
                      required
                      disabled={isLoading}
                      className="border-2"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="preferred_date">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Preferred Start Date
                      </Label>
                      <Input
                        id="preferred_date"
                        name="preferred_date"
                        type="date"
                        value={formData.preferred_date}
                        onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                        disabled={isLoading}
                        className="border-2"
                      />
                    </div>

                    {formData.request_type === "on_site" && (
                      <div className="space-y-2">
                        <Label htmlFor="site_address">Site Address</Label>
                        <Input
                          id="site_address"
                          name="site_address"
                          value={formData.site_address}
                          onChange={(e) => setFormData({ ...formData, site_address: e.target.value })}
                          placeholder="Enter the project site address"
                          disabled={isLoading}
                          className="border-2"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-6 border-t-2">
                  <Button 
                    type="submit" 
                    disabled={isLoading} 
                    className="w-full h-12 text-lg font-medium"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Submitting Request...
                      </div>
                    ) : (
                      "Submit Project Request"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Additional Information */}
        <div className="text-center mt-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-6 bg-card rounded-lg border">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Quick Response</h3>
              <p className="text-sm text-muted-foreground">
                Get a response within 24 hours with initial project assessment
              </p>
            </div>

            <div className="p-6 bg-card rounded-lg border">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Expert Team</h3>
              <p className="text-sm text-muted-foreground">
                Work with experienced developers and project managers
              </p>
            </div>

            <div className="p-6 bg-card rounded-lg border">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Free Consultation</h3>
              <p className="text-sm text-muted-foreground">
                No obligation consultation to discuss your project needs
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}