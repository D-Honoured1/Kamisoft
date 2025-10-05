import { getAllBlogPosts } from "@/lib/queries/content"
import { BlogCard } from "@/components/blog-card"
import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "Blog | Kamisoft Enterprises - Technology Insights & Tutorials",
  description:
    "Read the latest articles on software development, blockchain, fintech, and technology trends from Kamisoft Enterprises.",
}

export default async function BlogPage() {
  const posts = await getAllBlogPosts({ published_only: true })

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

      {/* Blog Posts Grid */}
      <section className="py-20">
        <div className="container">
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
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
