"use client"

import { useEffect, useState } from "react"
import { BlogCard } from "@/components/blog-card"
import { Badge } from "@/components/ui/badge"
import { InfiniteCarousel } from "@/components/ui/infinite-carousel"

export default function BlogPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPosts() {
      try {
        const response = await fetch('/api/admin/blog')
        if (response.ok) {
          const data = await response.json()
          setPosts(data.posts?.filter((p: any) => p.is_published) || [])
        }
      } catch (error) {
        console.error('Failed to load blog posts:', error)
      } finally {
        setLoading(false)
      }
    }
    loadPosts()
  }, [])

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-background to-muted/50">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="text-sm">
              Blog & Insights
            </Badge>

            <h1 className="text-4xl lg:text-6xl font-bold text-balance">
              Latest from <span className="text-primary">Kamisoft</span>
            </h1>

            <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
              Insights on technology, software development, blockchain, fintech, and digital
              innovation from our team of experts.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Posts Carousel */}
      <section className="py-20">
        <div className="container">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading blog posts...</p>
            </div>
          ) : posts.length > 0 ? (
            <InfiniteCarousel>
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </InfiniteCarousel>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No blog posts published yet. Check back soon for insights and tutorials!
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
