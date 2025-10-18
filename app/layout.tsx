import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Toaster } from "sonner"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Kamisoft Enterprises — Full-Spectrum Technology Solutions | Nigeria",
  description:
    "Expert technology partner delivering fintech platforms, blockchain solutions, cloud & DevOps, AI automation, CCNA networking, mobile & web apps, and IT consultancy across Africa. 200+ projects since 2015.",
  keywords: "fintech developers Nigeria, blockchain solutions Africa, web app development, mobile banking apps, payment gateway Nigeria, enterprise software, digital wallet development, smart contracts, CCNA networking Nigeria, cloud infrastructure AWS Azure, DevOps CI/CD, AI automation, machine learning Nigeria, chatbot development, technology consultancy Africa, digital transformation, network security, cloud migration, process automation, full stack development",
  authors: [{ name: "Kamisoft Enterprises" }],
  creator: "Kamisoft Enterprises",
  publisher: "Kamisoft Enterprises",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.kamisoftenterprises.online",
    title: "Kamisoft Enterprises — Full-Spectrum Technology Solutions in Nigeria",
    description: "Fintech, Blockchain, Cloud & DevOps, AI Automation, CCNA Networking, Mobile & Web Development. 200+ successful projects since 2015.",
    siteName: "Kamisoft Enterprises",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kamisoft Enterprises — Full-Spectrum Tech Solutions",
    description: "Fintech • Blockchain • Cloud • AI • Networking • Web/Mobile Development. Operating since 2015 across Africa.",
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
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <Suspense fallback={null}>
            <div className="min-h-screen flex flex-col">
              <Navigation />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </Suspense>
          <Toaster position="top-right" richColors />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}