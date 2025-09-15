// lib/supabase/client.ts - FIXED VERSION
import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

// Remove the duplicate function - they do the same thing
export function createClient() {
  return createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Remove this duplicate function
// export function createBrowserClient() {
//   return createSupabaseBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
// }