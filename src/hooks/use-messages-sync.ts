"use client"

import { useEffect, useRef } from "react"
import type { UIMessage } from "ai"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import type { Message } from "@/types"

interface UseMessagesSyncOptions {
  chatId: string
  messages: UIMessage[]
  setMessages: (messages: UIMessage[] | ((prev: UIMessage[]) => UIMessage[])) => void
  isStreaming: boolean
}

export function useMessagesSync({ chatId, messages, setMessages, isStreaming }: UseMessagesSyncOptions) {
  const messagesRef = useRef(messages)
  messagesRef.current = messages

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()

    const channel = supabase
      .channel(`messages-sync-${chatId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` },
        (payload) => {
          if (isStreaming) return

          const row = payload.new as Message
          const alreadyExists = messagesRef.current.some((m) => m.id === row.id)
          if (alreadyExists) return

          const newMessage: UIMessage = {
            id: row.id,
            role: row.role,
            parts: row.parts as UIMessage["parts"],
          }

          setMessages((prev) => [...prev, newMessage])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chatId, isStreaming, setMessages])
}
