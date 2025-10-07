/**
 * Utility functions for handling project homepage images and image fallbacks
 */

export async function fetchProjectHomepageImage(projectUrl: string): Promise<string | null> {
  try {
    if (!projectUrl) return null

    // Use our server-side API to scrape the homepage image
    const response = await fetch(`/api/scrape/homepage-image?url=${encodeURIComponent(projectUrl)}`)

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    if (data.success && data.imageUrl) {
      return data.imageUrl
    }

    return null
  } catch (error) {
    return null
  }
}

export function getImageDisplayUrl(featuredImageUrl?: string, homepageImageUrl?: string): string | null {
  return featuredImageUrl || homepageImageUrl || null
}

export function generateProjectImagePlaceholder(projectTitle: string): string {
  // Generate a simple SVG placeholder with project initials
  const initials = projectTitle
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase()

  const colors = [
    '#3B82F6', // blue-500
    '#10B981', // green-500
    '#8B5CF6', // purple-500
    '#F59E0B', // orange-500
    '#EC4899', // pink-500
    '#6366F1'  // indigo-500
  ]

  const colorIndex = projectTitle.length % colors.length
  const bgColor = colors[colorIndex]

  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="${bgColor}" />
      <text x="50%" y="50%" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="600" fill="white" text-anchor="middle" dominant-baseline="middle">
        ${initials}
      </text>
    </svg>
  `)}`
}

export const PROJECT_IMAGE_PATTERNS = {
  OG_IMAGE: '/og-image.png',
  SOCIAL_IMAGE: '/social-image.png',
  FAVICON_192: '/favicon-192x192.png',
  APPLE_TOUCH: '/apple-touch-icon.png',
  FAVICON: '/favicon.ico'
} as const