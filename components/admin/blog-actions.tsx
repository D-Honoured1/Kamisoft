"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function BlogActions({ postId, postTitle }: { postId: string; postTitle: string }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete "${postTitle}"?`)) return

    try {
      const response = await fetch(`/api/admin/blog/${postId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete")
      }

      router.refresh()
    } catch (error) {
      console.error("Failed to delete blog post:", error)
      alert("Failed to delete blog post")
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleDelete}>
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
