"use client"

import { Button } from "@/components/ui/button"
import { Trash2, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function TestimonialActions({
  testimonialId,
  testimonialName,
  isVerified
}: {
  testimonialId: string
  testimonialName: string
  isVerified: boolean
}) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete the testimonial from "${testimonialName}"?`)) return

    try {
      const response = await fetch(`/api/admin/testimonials/${testimonialId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete")
      }

      toast.success("Testimonial deleted successfully")
      router.refresh()
    } catch (error) {
      console.error("Failed to delete testimonial:", error)
      toast.error("Failed to delete testimonial")
    }
  }

  async function handleVerify() {
    try {
      const response = await fetch(`/api/admin/testimonials/${testimonialId}/verify`, {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to verify")
      }

      toast.success("Testimonial verified successfully!")
      router.refresh()
    } catch (error: any) {
      console.error("Failed to verify testimonial:", error)
      toast.error(`Failed to verify testimonial: ${error.message}`)
    }
  }

  return (
    <>
      {!isVerified && (
        <Button variant="outline" size="sm" onClick={handleVerify}>
          <CheckCircle className="h-4 w-4 mr-1" />
          Verify
        </Button>
      )}
      <Button variant="destructive" size="sm" onClick={handleDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </>
  )
}
