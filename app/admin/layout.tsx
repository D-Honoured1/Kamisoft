import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminNavigation } from "@/components/admin-navigation"
import type React from "react"

export const dynamic = "force-dynamic"

export default async function AdminLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Temporarily disable Supabase check, use JWT instead
  // if (!user) {
  //   redirect("/admin/login")
  // }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}