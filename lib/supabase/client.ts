// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // use the built-in browser cookie adapter
        get(key) {
          return document.cookie
            .split("; ")
            .find((row) => row.startsWith(`${key}=`))
            ?.split("=")[1]
        },
        set(key, value, options) {
          let cookie = `${key}=${value}; path=/;`
          if (options?.maxAge) cookie += ` max-age=${options.maxAge};`
          if (options?.expires) cookie += ` expires=${options.expires.toUTCString()};`
          if (options?.secure) cookie += " secure;"
          if (options?.httpOnly) cookie += " httponly;"
          document.cookie = cookie
        },
        remove(key) {
          document.cookie = `${key}=; path=/; max-age=0;`
        },
      },
    }
  )
}
