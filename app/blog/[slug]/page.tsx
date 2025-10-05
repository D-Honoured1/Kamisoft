import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getBlogPostBySlug, incrementBlogPostViews } from "@/lib/queries/content"
import { Badge } from "@/components/ui/badge"
import { Calendar, Eye, Clock, User } from "lucide-react"

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  try {
    const post = await getBlogPostBySlug(params.slug)

    if (!post || !post.is_published) {
      return {
        title: "Post Not Found",
      }
    }

    return {
      title: post.meta_title || `${post.title} | Kamisoft Blog`,
      description: post.meta_description || post.excerpt || post.title,
      keywords: post.meta_keywords?.join(", "),
      openGraph: {
        title: post.meta_title || post.title,
        description: post.meta_description || post.excerpt || "",
        images: post.cover_image_url ? [{ url: post.cover_image_url }] : [],
        type: "article",
        publishedTime: post.published_at || post.created_at,
        authors: post.author_name ? [post.author_name] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: post.meta_title || post.title,
        description: post.meta_description || post.excerpt || "",
        images: post.cover_image_url ? [post.cover_image_url] : [],
      },
    }
  } catch (error) {
    return {
      title: "Post Not Found",
    }
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  let post
  try {
    post = await getBlogPostBySlug(params.slug)
  } catch (error) {
    notFound()
  }

  if (!post || !post.is_published) {
    notFound()
  }

  // Increment view count (fire and forget)
  incrementBlogPostViews(post.id)

  return (
    <div className="flex flex-col">
      <article className="container py-20 max-w-4xl">
        <header className="mb-12">
          {post.category && (
            <Badge variant="secondary" className="mb-4">
              {post.category}
            </Badge>
          )}

          <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-balance">{post.title}</h1>

          {post.excerpt && (
            <p className="text-xl text-muted-foreground mb-6 text-balance">{post.excerpt}</p>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {post.author_name && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{post.author_name}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(post.published_at || post.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            {post.read_time_minutes && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{post.read_time_minutes} min read</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>{post.view_count} views</span>
            </div>
          </div>
        </header>

        {post.cover_image_url && (
          <div className="mb-12">
            <img
              src={post.cover_image_url}
              alt={post.cover_image_alt || post.title}
              className="w-full rounded-lg shadow-lg"
            />
          </div>
        )}

        <div
          className="prose prose-lg max-w-none prose-headings:scroll-mt-20 prose-a:text-primary prose-img:rounded-lg"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {post.tags && post.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t">
            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-sm font-semibold text-muted-foreground">Tags:</span>
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  )
}
