"use client"

import { useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import type { Chat } from "@/types"
import { applyRenameToChats } from "@/lib/chats"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"

export function useChatsSync(userId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    const supabase = createSupabaseBrowserClient()
    const channel = supabase
      .channel("chats-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chats", filter: `user_id=eq.${userId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["chats"] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, queryClient])
}

export function useChats(enabled = true) {
  return useQuery<Chat[]>({
    queryKey: ["chats"],
    queryFn: async () => {
      const res = await fetch("/api/chats")
      if (!res.ok) throw new Error("Failed to fetch chats")
      return res.json()
    },
    enabled,
  })
}

export function useCreateChat() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async (data?: { title?: string; model?: string; deduplicate?: boolean }) => {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data ?? {}),
      })
      if (!res.ok) throw new Error("Failed to create chat")
      const chat = (await res.json()) as Chat
      return { chat, isNew: res.status === 201 }
    },
    onSuccess: ({ chat, isNew }) => {
      if (isNew) {
        queryClient.setQueryData<Chat[]>(["chats"], (old) => [chat, ...(old ?? [])])
      }
      router.push(`/chat/${chat.id}`)
    },
  })
}

export function useRenameChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const res = await fetch(`/api/chats/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      })
      if (!res.ok) throw new Error("Failed to rename chat")
      return res.json()
    },
    onMutate: async ({ id, title }) => {
      await queryClient.cancelQueries({ queryKey: ["chats"] })
      const previous = queryClient.getQueryData<Chat[]>(["chats"])
      queryClient.setQueryData<Chat[]>(["chats"], (old) => applyRenameToChats(old, id, title))
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["chats"], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] })
    },
  })
}

export function useDeleteChat() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/chats/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete chat")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] })
      router.push("/")
    },
  })
}
