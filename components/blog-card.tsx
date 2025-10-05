import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { BlogPost } from "@/lib/types/database"
import { Calendar, Eye, Clock } from "lucide-react"

interface BlogCardProps {
  post: BlogPost
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <Link href={`/blog/${post.slug}`}>
      <Card className="h-full hover:shadow-lg transition-shadow duration-300 group">
        {post.cover_image_url && (
          <div className="overflow-hidden rounded-t-lg">
            <img
              src={post.cover_image_url}
              alt={post.cover_image_alt || post.title}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <CardHeader>
          <div className="flex gap-2 mb-2">
            {post.category && <Badge variant="secondary">{post.category}</Badge>}
            {post.is_featured && <Badge variant="default">Featured</Badge>}
          </div>
          <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {post.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{post.excerpt}</p>
          )}
          <div className="flex gap-4 text-xs text-muted-foreground">
            {post.published_at && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(post.published_at).toLocaleDateString()}</span>
              </div>
            )}
            {post.view_count > 0 && (
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{post.view_count}</span>
              </div>
            )}
            {post.read_time_minutes && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{post.read_time_minutes} min</span>
              </div>
            )}
          </div>
          {post.tags && post.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-3">
              {post.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
