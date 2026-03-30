"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"

export function useAuth() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createSupabaseBrowserClient()

  const signIn = async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
    } else {
      queryClient.clear()
      router.push("/")
      router.refresh()
    }
    setIsLoading(false)
  }

  const signUp = async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)
    // If currently anonymous, convert in-place (preserves user_id and all chats).
    // Use getSession() (local storage read) instead of getUser() (network call)
    // to reliably detect anonymous state during sign-up.
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession()
    const anonymousUserId = currentSession?.user?.is_anonymous
      ? currentSession.user.id
      : null

    const { error } = anonymousUserId
      ? await supabase.auth.updateUser({ email, password })
      : await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      setIsLoading(false)
      return
    }

    // If the anonymous user was converted in-place, user_id is preserved —
    // just invalidate to re-fetch the same chats.
    // If a new user was created (e.g. updateUser signed the user out due to
    // email confirmation), migrate chats from the old anonymous user as a fallback.
    if (anonymousUserId) {
      const {
        data: { session: newSession },
      } = await supabase.auth.getSession()
      const newUserId = newSession?.user?.id
      if (newUserId && newUserId !== anonymousUserId) {
        await fetch("/api/auth/migrate-chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ anonymousUserId }),
        })
      }
      queryClient.invalidateQueries({ queryKey: ["chats"] })
    } else {
      queryClient.clear()
    }

    router.push("/")
    router.refresh()
    setIsLoading(false)
  }

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    queryClient.clear()
    router.push("/login")
    router.refresh()
  }

  const signInAnonymously = async () => {
    setIsLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInAnonymously()
    if (error) {
      setError(error.message)
    } else {
      router.push("/")
      router.refresh()
    }
    setIsLoading(false)
  }

  return { signIn, signUp, signOut, signInAnonymously, isLoading, error }
}
