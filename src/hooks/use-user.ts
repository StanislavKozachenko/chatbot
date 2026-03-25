"use client"

import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"

export function useUser() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return user
}
