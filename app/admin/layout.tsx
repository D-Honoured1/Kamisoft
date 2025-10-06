import type React from "react"
import { AdminAuthProvider } from "@/components/providers/admin-auth-provider"

export const dynamic = "force-dynamic"

export default function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <AdminAuthProvider>
      <div className="min-h-screen bg-background">
        <main className="flex-1">
          {children}
        </main>
      </div>
    </AdminAuthProvider>
  )
}