"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function TeamActions({ memberId, memberName }: { memberId: string; memberName: string }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm(`Are you sure you want to remove ${memberName} from the team?`)) return

    try {
      const response = await fetch(`/api/admin/team/${memberId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete")
      }

      router.refresh()
    } catch (error) {
      alert("Failed to delete team member")
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleDelete}>
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
