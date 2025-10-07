export const dynamic = "force-dynamic"

import { requireAuth } from "@/lib/auth/server-auth"
import { createServerClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DashboardHomeButton } from "@/components/admin-navigation/dashboard-home-button"
import { Plus, Edit } from "lucide-react"
import { FAQActions } from "@/components/admin/faq-actions"

export default async function AdminFAQPage() {
  await requireAuth()

  const supabase = createServerClient()

  const { data: faqs, error } = await supabase
    .from("faqs")
    .select("*")
    .order("display_order", { ascending: true })

  if (error) {
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardHomeButton />

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">FAQs</h1>
          <p className="text-muted-foreground mt-1">{faqs?.length || 0} total FAQs</p>
        </div>
        <Button asChild>
          <Link href="/admin/faq/new">
            <Plus className="mr-2 h-4 w-4" />
            New FAQ
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {faqs && faqs.length > 0 ? faqs.map((faq: any) => (
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
                <FAQActions faqId={faq.id} faqQuestion={faq.question} />
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
        )) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No FAQs found. Create your first one to get started.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
