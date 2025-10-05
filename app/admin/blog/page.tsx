"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { getAllBlogPosts, deleteBlogPost } from "@/lib/queries/content-client"
import type { BlogPost } from "@/lib/types/database"
import { Plus, Edit, Trash2, Eye, Search } from "lucide-react"

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  useEffect(() => {
    loadPosts()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = posts.filter(
        (post) =>
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredPosts(filtered)
    } else {
      setFilteredPosts(posts)
    }
  }, [searchTerm, posts])

  async function loadPosts() {
    try {
      const data = await getAllBlogPosts()
      setPosts(data)
      setFilteredPosts(data)
    } catch (error) {
      console.error("Failed to load blog posts:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return

    try {
      await deleteBlogPost(id)
      setPosts(posts.filter((p) => p.id !== id))
    } catch (error) {
      console.error("Failed to delete blog post:", error)
      alert("Failed to delete blog post")
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading blog posts...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Blog Posts</h1>
          <p className="text-muted-foreground mt-1">{posts.length} total posts</p>
        </div>
        <Button asChild>
          <Link href="/admin/blog/new">
            <Plus className="mr-2 h-4 w-4" />
            New Blog Post
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search blog posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredPosts.map((post) => (
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
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(post.id, post.title)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {post.excerpt && <p className="text-sm text-muted-foreground mb-3">{post.excerpt}</p>}
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>Views: {post.view_count}</span>
                {post.author_name && <span>Author: {post.author_name}</span>}
                <span>Created: {new Date(post.created_at).toLocaleDateString()}</span>
                {post.published_at && (
                  <span>Published: {new Date(post.published_at).toLocaleDateString()}</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredPosts.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {searchTerm
                ? "No blog posts found matching your search."
                : "No blog posts found. Create your first post to get started."}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
