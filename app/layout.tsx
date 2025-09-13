import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Kamisoft Enterprises - From Code to Connectivity",
  description:
    "Kamisoft Enterprises is a technology company offering bespoke solutions across fintech, gaming, and enterprise software. Founded in 2015, we build it all.",
  keywords: "software development, fintech, blockchain, mobile apps, enterprise software, Nigeria, technology",
  authors: [{ name: "Kamisoft Enterprises" }],
  creator: "Kamisoft Enterprises",
  publisher: "Kamisoft Enterprises",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://kamisoft.com",
    title: "Kamisoft Enterprises - From Code to Connectivity",
    description: "Technology company offering bespoke solutions across fintech, gaming, and enterprise software.",
    siteName: "Kamisoft Enterprises",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kamisoft Enterprises - From Code to Connectivity",
    description: "Technology company offering bespoke solutions across fintech, gaming, and enterprise software.",
    creator: "@kamisoft",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <Suspense fallback={null}>
            <div className="min-h-screen flex flex-col">
              <Navigation />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </Suspense>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
