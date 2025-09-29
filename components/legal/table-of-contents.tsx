"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, List } from "lucide-react"
import { cn } from "@/lib/utils"

interface TocItem {
  id: string
  title: string
  level: number
}

interface TableOfContentsProps {
  className?: string
  sticky?: boolean
}

export function TableOfContents({ className, sticky = true }: TableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeId, setActiveId] = useState<string>("")
  const [tocItems, setTocItems] = useState<TocItem[]>([])

  useEffect(() => {
    // Extract headings from the document
    const headings = document.querySelectorAll("h2, h3, h4")
    const items: TocItem[] = []

    headings.forEach((heading, index) => {
      const id = heading.id || `heading-${index}`
      if (!heading.id) {
        heading.id = id
      }

      const level = parseInt(heading.tagName.charAt(1))
      items.push({
        id,
        title: heading.textContent || "",
        level,
      })
    })

    setTocItems(items)
  }, [])

  useEffect(() => {
    // Handle scroll to highlight active section
    const handleScroll = () => {
      const headings = tocItems.map(item => document.getElementById(item.id)).filter(Boolean)

      let current = ""
      for (const heading of headings) {
        if (heading && heading.offsetTop <= window.scrollY + 100) {
          current = heading.id
        }
      }

      setActiveId(current)
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll() // Initial call

    return () => window.removeEventListener("scroll", handleScroll)
  }, [tocItems])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  if (tocItems.length === 0) return null

  return (
    <Card
      className={cn(
        "w-full lg:w-80 print:hidden",
        sticky && "lg:sticky lg:top-8",
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <List className="h-5 w-5" />
            Table of Contents
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden"
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent
        className={cn(
          "pt-0 transition-all duration-200",
          !isOpen && "hidden lg:block"
        )}
      >
        <nav>
          <ul className="space-y-1">
            {tocItems.map((item) => (
              <li key={item.id}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-left h-auto py-2 px-3 text-sm font-normal",
                    item.level === 3 && "pl-6",
                    item.level === 4 && "pl-9",
                    activeId === item.id && "bg-primary/10 text-primary font-medium"
                  )}
                  onClick={() => scrollToSection(item.id)}
                >
                  <span className="line-clamp-2">{item.title}</span>
                </Button>
              </li>
            ))}
          </ul>
        </nav>
      </CardContent>
    </Card>
  )
}

// Hook to automatically add IDs to headings
export function useAutoHeadingIds() {
  useEffect(() => {
    const headings = document.querySelectorAll("h2, h3, h4")
    headings.forEach((heading, index) => {
      if (!heading.id) {
        const text = heading.textContent || ""
        const id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .trim()
        heading.id = id || `heading-${index}`
      }
    })
  }, [])
}