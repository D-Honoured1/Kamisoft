"use client"

import { useEffect, useState } from "react"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { getAllFAQs, deleteFAQ } from "@/lib/queries/content-client"
import type { FAQ } from "@/lib/types/database"
import { Plus, Edit, Trash2, Search } from "lucide-react"

export default function AdminFAQPage() {
  const { user, loading: authLoading, isAuthenticated } = useAdminAuth()
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login')
    }
  }, [authLoading, isAuthenticated, router])

  if (authLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  if (!user) return null

  useEffect(() => {
    loadFAQs()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
          faq.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredFaqs(filtered)
    } else {
      setFilteredFaqs(faqs)
    }
  }, [searchTerm, faqs])

  async function loadFAQs() {
    try {
      const data = await getAllFAQs()
      setFaqs(data)
      setFilteredFaqs(data)
    } catch (error) {
      console.error("Failed to load FAQs:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, question: string) {
    if (!confirm(`Are you sure you want to delete the FAQ: "${question.substring(0, 50)}..."?`))
      return

    try {
      await deleteFAQ(id)
      setFaqs(faqs.filter((faq) => faq.id !== id))
    } catch (error) {
      console.error("Failed to delete FAQ:", error)
      alert("Failed to delete FAQ")
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading FAQs...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">FAQs</h1>
          <p className="text-muted-foreground mt-1">{faqs.length} total FAQs</p>
        </div>
        <Button asChild>
          <Link href="/admin/faq/new">
            <Plus className="mr-2 h-4 w-4" />
            New FAQ
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search FAQs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredFaqs.map((faq) => (
          <Card key={faq.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">{faq.question}</CardTitle>
                <div className="flex gap-2 flex-wrap mb-2">
                  {faq.is_published ? (
                    <Badge variant="default">Published</Badge>
                  ) : (
                    <Badge variant="secondary">Draft</Badge>
                  )}
                  {faq.category && (
                    <Badge variant="outline" className="capitalize">
                      {faq.category.replace(/_/g, " ")}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/faq/edit/${faq.id}`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(faq.id, faq.question)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div
                className="text-sm text-muted-foreground mb-3 line-clamp-2"
                dangerouslySetInnerHTML={{ __html: faq.answer }}
              />
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>Order: {faq.display_order}</span>
                <span>Created: {new Date(faq.created_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredFaqs.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {searchTerm
                ? "No FAQs found matching your search."
                : "No FAQs found. Create your first one to get started."}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
