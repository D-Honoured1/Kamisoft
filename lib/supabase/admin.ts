// lib/supabase/admin.ts
import { createClient } from "@supabase/supabase-js"

/**
 * Creates a Supabase client with service role key
 * This bypasses Row Level Security (RLS) policies
 * ONLY use this in admin API routes after verifying authentication
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
