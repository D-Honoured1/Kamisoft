"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, MessageCircle, Send, ArrowRight, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { SERVICE_CATEGORIES } from "@/lib/constants/services"
import type { ServiceRequestForm } from "@/lib/types/database"

type Step = "welcome" | "contact" | "service" | "details" | "type" | "onsite" | "review" | "success"

export default function RequestServicePage() {
  const [currentStep, setCurrentStep] = useState<Step>("welcome")
  const [formData, setFormData] = useState<ServiceRequestForm>({
    name: "",
    email: "",
    phone: "",
    company: "",
    service_category: "full_stack_development",
    request_type: "digital",
    title: "",
    description: "",
    preferred_date: "",
    site_address: "",
  })
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: keyof ServiceRequestForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    const stepOrder: Step[] = ["welcome", "contact", "service", "details", "type", "onsite", "review", "success"]
    const currentIndex = stepOrder.indexOf(currentStep)

    if (currentStep === "type" && formData.request_type === "digital") {
      setCurrentStep("review") // Skip onsite step for digital requests
    } else if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1])
    }
  }

  const handleBack = () => {
    const stepOrder: Step[] = ["welcome", "contact", "service", "details", "type", "onsite", "review"]
    const currentIndex = stepOrder.indexOf(currentStep)

    if (currentStep === "review" && formData.request_type === "digital") {
      setCurrentStep("type") // Skip onsite step for digital requests
    } else if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1])
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      const requestData = {
        ...formData,
        preferred_date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined,
      }

      const response = await fetch("/api/service-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        throw new Error("Failed to submit request")
      }

      const result = await response.json()
      console.log("Service request submitted:", result)

      setCurrentStep("success")
    } catch (error) {
      console.error("Error submitting request:", error)
      // TODO: Show error message to user
    } finally {
      setIsSubmitting(false)
    }
  }

  // ... existing code for renderStep function and other methods ...

  const renderStep = () => {
    switch (currentStep) {
      case "welcome":
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome to Kamisoft</h2>
              <p className="text-muted-foreground">
                Let's discuss your project requirements. This will only take a few minutes.
              </p>
            </div>
            <Button onClick={handleNext} size="lg">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )

      case "contact":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Tell us about yourself</h2>
              <p className="text-muted-foreground">We'll use this information to get in touch with you.</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+234 XXX XXX XXXX"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    placeholder="Your Company Name"
                    value={formData.company}
                    onChange={(e) => handleInputChange("company", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={handleNext} disabled={!formData.name || !formData.email} className="flex-1">
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )

      case "service":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">What service do you need?</h2>
              <p className="text-muted-foreground">Select the service that best matches your project.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(SERVICE_CATEGORIES).map(([key, service]) => (
                <Card
                  key={key}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md border-2",
                    formData.service_category === key ? "border-primary bg-primary/5" : "border-border",
                  )}
                  onClick={() => handleInputChange("service_category", key as any)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{service.icon}</div>
                      <div>
                        <CardTitle className="text-base">{service.label}</CardTitle>
                        <CardDescription className="text-sm">{service.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={handleNext} className="flex-1">
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )

      case "details":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Project Details</h2>
              <p className="text-muted-foreground">Tell us more about your project requirements.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., E-commerce Website Development"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Project Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your project requirements, goals, timeline, and any specific features you need..."
                  rows={6}
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={handleNext} disabled={!formData.title || !formData.description} className="flex-1">
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )

      case "type":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Service Type</h2>
              <p className="text-muted-foreground">How would you like us to deliver this service?</p>
            </div>

            <RadioGroup
              value={formData.request_type}
              onValueChange={(value) => handleInputChange("request_type", value as any)}
              className="space-y-4"
            >
              <Card
                className={cn(
                  "p-4 cursor-pointer transition-all hover:shadow-md border-2",
                  formData.request_type === "digital" ? "border-primary bg-primary/5" : "border-border",
                )}
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="digital" id="digital" />
                  <div className="flex-1">
                    <Label htmlFor="digital" className="text-base font-medium cursor-pointer">
                      Digital Service
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Remote development and delivery. Perfect for web apps, mobile apps, and software solutions.
                    </p>
                  </div>
                </div>
              </Card>

              <Card
                className={cn(
                  "p-4 cursor-pointer transition-all hover:shadow-md border-2",
                  formData.request_type === "on_site" ? "border-primary bg-primary/5" : "border-border",
                )}
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="on_site" id="on_site" />
                  <div className="flex-1">
                    <Label htmlFor="on_site" className="text-base font-medium cursor-pointer">
                      On-Site Service
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Our team visits your location. Ideal for networking, consultancy, and system installations.
                    </p>
                  </div>
                </div>
              </Card>
            </RadioGroup>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={handleNext} className="flex-1">
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )

      case "onsite":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">On-Site Details</h2>
              <p className="text-muted-foreground">Additional information for your on-site service request.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site_address">Site Address *</Label>
                <Textarea
                  id="site_address"
                  placeholder="Enter the complete address where our team should visit..."
                  rows={3}
                  value={formData.site_address}
                  onChange={(e) => handleInputChange("site_address", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Preferred Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={handleNext} disabled={!formData.site_address} className="flex-1">
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )

      case "review":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Review Your Request</h2>
              <p className="text-muted-foreground">Please review your information before submitting.</p>
            </div>

            <div className="space-y-4">
              <Card className="border-0 bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span>{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span>{formData.email}</span>
                  </div>
                  {formData.phone && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span>{formData.phone}</span>
                    </div>
                  )}
                  {formData.company && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Company:</span>
                      <span>{formData.company}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service:</span>
                    <span>
                      {SERVICE_CATEGORIES[formData.service_category as keyof typeof SERVICE_CATEGORIES]?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant={formData.request_type === "digital" ? "default" : "secondary"}>
                      {formData.request_type === "digital" ? "Digital" : "On-Site"}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Title:</span>
                    <p>{formData.title}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Description:</span>
                    <p className="text-xs leading-relaxed">{formData.description}</p>
                  </div>
                  {formData.request_type === "on_site" && (
                    <>
                      {formData.site_address && (
                        <div className="space-y-1">
                          <span className="text-muted-foreground">Address:</span>
                          <p className="text-xs">{formData.site_address}</p>
                        </div>
                      )}
                      {selectedDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Preferred Date:</span>
                          <span>{format(selectedDate, "PPP")}</span>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  "Submitting..."
                ) : (
                  <>
                    Submit Request <Send className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )

      case "success":
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Send className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Request Submitted Successfully!</h2>
              <p className="text-muted-foreground mb-4">
                Thank you for choosing Kamisoft Enterprises. We've received your service request and will get back to
                you within 24 hours.
              </p>
              <div className="bg-muted/50 rounded-lg p-4 text-sm">
                <p className="font-medium mb-2">What happens next?</p>
                <ul className="text-left space-y-1 text-muted-foreground">
                  <li>• Our team will review your requirements</li>
                  <li>• We'll prepare a detailed proposal and quote</li>
                  <li>• You'll receive an email with next steps</li>
                  <li>• We'll schedule a consultation call if needed</li>
                </ul>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => (window.location.href = "/")}>Back to Home</Button>
              <Button variant="outline" onClick={() => (window.location.href = "/services")}>
                View Services
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const getStepNumber = () => {
    const steps = ["welcome", "contact", "service", "details", "type", "onsite", "review"]
    let stepIndex = steps.indexOf(currentStep)
    if (currentStep === "review" && formData.request_type === "digital") {
      stepIndex = 5 // Adjust for skipped onsite step
    }
    return Math.max(0, stepIndex)
  }

  const getTotalSteps = () => {
    return formData.request_type === "digital" ? 6 : 7
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 py-12">
      <div className="container max-w-2xl">
        {/* Progress Bar */}
        {currentStep !== "welcome" && currentStep !== "success" && (
          <div className="mb-8">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>
                Step {getStepNumber()} of {getTotalSteps()}
              </span>
              <span>{Math.round((getStepNumber() / getTotalSteps()) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(getStepNumber() / getTotalSteps()) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Main Card */}
        <Card className="border-0 shadow-lg bg-card/80 backdrop-blur">
          <CardContent className="p-8">{renderStep()}</CardContent>
        </Card>

        {/* Help Text */}
        {currentStep !== "success" && (
          <div className="text-center mt-6 text-sm text-muted-foreground">
            Need help? Contact us at{" "}
            <a href="mailto:hello@kamisoft.com" className="text-primary hover:underline">
              hello@kamisoft.com
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
