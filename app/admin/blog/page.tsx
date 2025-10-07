export const dynamic = "force-dynamic"

import { requireAuth } from "@/lib/auth/server-auth"
import { createServerClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DashboardHomeButton } from "@/components/admin-navigation/dashboard-home-button"
import { Plus, Edit, Eye } from "lucide-react"
import { BlogActions } from "@/components/admin/blog-actions"

export default async function AdminBlogPage() {
  await requireAuth()

  const supabase = createServerClient()

  const { data: posts, error } = await supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardHomeButton />

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Blog Posts</h1>
          <p className="text-muted-foreground mt-1">{posts?.length || 0} total posts</p>
        </div>
        <Button asChild>
          <Link href="/admin/blog/new">
            <Plus className="mr-2 h-4 w-4" />
            New Blog Post
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {posts && posts.length > 0 ? posts.map((post: any) => (
          <Card key={post.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">{post.title}</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  {post.is_published ? (
                    <Badge variant="default">Published</Badge>
                  ) : (
                    <Badge variant="secondary">Draft</Badge>
                  )}
                  {post.is_featured && <Badge variant="outline">Featured</Badge>}
                  {post.category && <Badge variant="outline">{post.category}</Badge>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/blog/${post.slug}`} target="_blank">
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/blog/edit/${post.id}`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
                <BlogActions postId={post.id} postTitle={post.title} />
              </div>
            </CardHeader>
            <CardContent>
              {post.excerpt && <p className="text-sm text-muted-foreground mb-3">{post.excerpt}</p>}
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>Views: {post.view_count || 0}</span>
                {post.author_name && <span>Author: {post.author_name}</span>}
                <span>Created: {new Date(post.created_at).toLocaleDateString()}</span>
                {post.published_at && (
                  <span>Published: {new Date(post.published_at).toLocaleDateString()}</span>
                )}
              </div>
            </CardContent>
          </Card>
        )) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No blog posts found. Create your first post to get started.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
