export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getAdminUser } from "@/lib/auth/server-auth"

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectUrl = searchParams.get('url')

    if (!projectUrl) {
      return NextResponse.json({ error: "Project URL is required" }, { status: 400 })
    }

    // Validate URL
    let url: URL
    try {
      url = new URL(projectUrl)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    // Common image patterns to try
    const imagePatterns = [
      // Open Graph and social media images
      `${url.origin}/og-image.png`,
      `${url.origin}/og-image.jpg`,
      `${url.origin}/social-image.png`,
      `${url.origin}/social-image.jpg`,
      `${url.origin}/twitter-image.png`,
      `${url.origin}/twitter-image.jpg`,

      // Common screenshot/preview patterns
      `${url.origin}/screenshot.png`,
      `${url.origin}/preview.png`,
      `${url.origin}/preview.jpg`,
      `${url.origin}/hero.png`,
      `${url.origin}/hero.jpg`,

      // Favicon patterns (as fallback)
      `${url.origin}/favicon-192x192.png`,
      `${url.origin}/apple-touch-icon.png`,
      `${url.origin}/favicon-180x180.png`,
      `${url.origin}/favicon.png`,

      // Common static asset paths
      `${url.origin}/static/og-image.png`,
      `${url.origin}/static/social-image.png`,
      `${url.origin}/assets/og-image.png`,
      `${url.origin}/images/og-image.png`,

      // Framework-specific patterns
      `${url.origin}/_next/static/media/og-image.png`, // Next.js
      `${url.origin}/public/og-image.png`,
    ]

    // Try to fetch the main page and parse meta tags
    let metaImageUrl: string | null = null
    try {
      const response = await fetch(projectUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Portfolio-Scraper/1.0)'
        }
      })

      if (response.ok) {
        const html = await response.text()

        // Extract og:image, twitter:image, etc.
        const ogImageMatch = html.match(/<meta[^>]*property=["\']og:image["\'][^>]*content=["\']([^"\']+)["\'][^>]*>/i)
        const twitterImageMatch = html.match(/<meta[^>]*name=["\']twitter:image["\'][^>]*content=["\']([^"\']+)["\'][^>]*>/i)

        if (ogImageMatch && ogImageMatch[1]) {
          metaImageUrl = ogImageMatch[1]
          // Make relative URLs absolute
          if (metaImageUrl.startsWith('/')) {
            metaImageUrl = url.origin + metaImageUrl
          } else if (!metaImageUrl.startsWith('http')) {
            metaImageUrl = url.origin + '/' + metaImageUrl
          }
        } else if (twitterImageMatch && twitterImageMatch[1]) {
          metaImageUrl = twitterImageMatch[1]
          if (metaImageUrl.startsWith('/')) {
            metaImageUrl = url.origin + metaImageUrl
          } else if (!metaImageUrl.startsWith('http')) {
            metaImageUrl = url.origin + '/' + metaImageUrl
          }
        }
      }
    } catch (error) {
      console.log('Could not parse HTML for meta tags:', error)
    }

    // If we found a meta image, try it first
    const urlsToTry = metaImageUrl
      ? [metaImageUrl, ...imagePatterns]
      : imagePatterns

    // Try each URL and return the first valid image
    for (const imageUrl of urlsToTry) {
      try {
        const response = await fetch(imageUrl, {
          method: 'HEAD',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Portfolio-Scraper/1.0)'
          }
        })

        if (response.ok) {
          const contentType = response.headers.get('content-type')
          const contentLength = response.headers.get('content-length')

          // Verify it's an image and not too small (avoid 1px tracking images)
          if (contentType?.startsWith('image/') &&
              (!contentLength || parseInt(contentLength) > 1000)) {
            return NextResponse.json({
              success: true,
              imageUrl: imageUrl,
              source: imageUrl === metaImageUrl ? 'meta-tag' : 'pattern-match'
            })
          }
        }
      } catch (error) {
        // Continue to next URL
        continue
      }
    }

    return NextResponse.json({
      success: false,
      message: "No suitable image found on the project homepage"
    })

  } catch (error) {
    console.error('Homepage image scraping error:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}