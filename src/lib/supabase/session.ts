import "server-only"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Session client using the anon key + request cookies.
 * Used in API routes and Server Components to read the current user's session.
 * For data access, use createServerClient() from server.ts (service role key).
 */
export async function createSessionClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
