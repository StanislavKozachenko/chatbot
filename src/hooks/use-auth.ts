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
    // If currently anonymous, convert in-place (preserves user_id and all chats)
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()
    const isAnonymous = currentUser?.is_anonymous ?? false
    const { error } = isAnonymous
      ? await supabase.auth.updateUser({ email, password })
      : await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
    } else {
      queryClient.clear()
      router.push("/")
      router.refresh()
    }
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
