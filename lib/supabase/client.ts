import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

/**
 * Create a Supabase client for use in the browser / client-side.
 * Use this in pages/components that run on the frontend.
 */
export const createBrowserClient = () =>
  createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
