// middleware.ts (root)
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  try {
    const supabase = createMiddlewareClient({ req, res });
    await supabase.auth.getSession(); // safe to call, does not throw if no session
  } catch (error) {
    console.error("Supabase middleware error:", error);
  }

  return res;
}
