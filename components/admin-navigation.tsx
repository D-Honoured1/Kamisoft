"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  Briefcase,
  UserCheck,
  BookOpen,
  Star,
  HelpCircle,
  UsersRound,
  FolderKanban,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { useState } from "react"

const navItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Clients",
    href: "/admin/clients",
    icon: Users,
  },
  {
    title: "Service Requests",
    href: "/admin/requests",
    icon: FileText,
  },
  {
    title: "Contact Submissions",
    href: "/admin/contact-submissions",
    icon: MessageSquare,
  },
  {
    title: "Portfolio",
    href: "/admin/portfolio",
    icon: Briefcase,
  },
  {
    title: "Leadership",
    href: "/admin/leadership",
    icon: UserCheck,
  },
  {
    title: "Content Management",
    items: [
      {
        title: "Blog Posts",
        href: "/admin/blog",
        icon: BookOpen,
      },
      {
        title: "Testimonials",
        href: "/admin/testimonials",
        icon: Star,
      },
      {
        title: "FAQ",
        href: "/admin/faq",
        icon: HelpCircle,
      },
      {
        title: "Team Members",
        href: "/admin/team",
        icon: UsersRound,
      },
      {
        title: "Case Studies",
        href: "/admin/case-studies",
        icon: FolderKanban,
      },
    ],
  },
]

export function AdminNavigation() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Don't show navigation on login/logout pages
  if (pathname === '/admin/login' || pathname === '/admin/logout') {
    return null
  }

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/admin" className="flex items-center space-x-2">
            <span className="text-xl font-bold">Kamisoft Admin</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              if ("items" in item) {
                return (
                  <div key={item.title} className="relative group">
                    <Button variant="ghost" className="gap-2">
                      <span>{item.title}</span>
                    </Button>
                    <div className="absolute top-full left-0 mt-1 w-56 bg-popover border rounded-md shadow-lg opacity-0 invisible invisible opacity-0 group-hover:opacity-100 group-hover:visible z-50">
                      <div className="py-1">
                        {item.items.map((subItem) => {
                          const Icon = subItem.icon
                          const isActive = pathname === subItem.href || pathname?.startsWith(subItem.href + "/")
                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              className={cn(
                                "flex items-center gap-2 px-4 py-2 text-sm ",
                                isActive && "bg-muted font-medium"
                              )}
                            >
                              <Icon className="h-4 w-4" />
                              {subItem.title}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              }

              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.title}
                  </Button>
                </Link>
              )
            })}

            <Link href="/admin/logout">
              <Button variant="ghost" className="gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-1">
            {navItems.map((item) => {
              if ("items" in item) {
                return (
                  <div key={item.title} className="space-y-1">
                    <div className="px-3 py-2 text-sm font-medium text-muted-foreground">
                      {item.title}
                    </div>
                    {item.items.map((subItem) => {
                      const Icon = subItem.icon
                      const isActive = pathname === subItem.href || pathname?.startsWith(subItem.href + "/")
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-2 px-6 py-2 text-sm  rounded-md",
                            isActive && "bg-muted font-medium"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {subItem.title}
                        </Link>
                      )
                    })}
                  </div>
                )
              }

              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm  rounded-md",
                    isActive && "bg-muted font-medium"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              )
            })}

            <Link
              href="/admin/logout"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm  rounded-md"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
