import type React from "react"

export const dynamic = "force-dynamic"

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}