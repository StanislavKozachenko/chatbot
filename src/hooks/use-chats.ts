"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import type { Chat } from "@/types"

export function useChats() {
  return useQuery<Chat[]>({
    queryKey: ["chats"],
    queryFn: async () => {
      const res = await fetch("/api/chats")
      if (!res.ok) throw new Error("Failed to fetch chats")
      return res.json()
    },
  })
}

export function useCreateChat() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async (data?: { title?: string; model?: string }) => {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data ?? {}),
      })
      if (!res.ok) throw new Error("Failed to create chat")
      return res.json() as Promise<Chat>
    },
    onSuccess: (chat) => {
      queryClient.invalidateQueries({ queryKey: ["chats"] })
      router.push(`/chat/${chat.id}`)
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
