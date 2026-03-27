"use client"

import { useEffect } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"

/**
 * Silently signs in anonymous users on first visit.
 * Runs once on mount — does nothing if a session already exists.
 */
export function AuthInitializer() {
  useEffect(() => {
    const supabase = createSupabaseBrowserClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        supabase.auth.signInAnonymously().catch(() => {})
      }
    })
  }, [])

  return null
}
