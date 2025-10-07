"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function CaseStudyActions({ caseStudyId, caseStudyTitle }: { caseStudyId: string; caseStudyTitle: string }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete the case study: "${caseStudyTitle}"?`)) return

    try {
      const response = await fetch(`/api/admin/case-studies/${caseStudyId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete")
      }

      router.refresh()
    } catch (error) {
      alert("Failed to delete case study")
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleDelete}>
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
