"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function FAQActions({ faqId, faqQuestion }: { faqId: string; faqQuestion: string }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete the FAQ: "${faqQuestion.substring(0, 50)}..."?`)) return

    try {
      const response = await fetch(`/api/admin/faq/${faqId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete")
      }

      router.refresh()
    } catch (error) {
      console.error("Failed to delete FAQ:", error)
      alert("Failed to delete FAQ")
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleDelete}>
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
