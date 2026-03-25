"use client"

import { useEffect, useRef } from "react"
import type { UIMessage } from "ai"
import { ChatMessage } from "./message"
import { Skeleton } from "@/components/ui/skeleton"

interface MessageListProps {
  messages: UIMessage[]
  isLoading: boolean
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Send a message to start the conversation
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="max-w-[75%] space-y-2 rounded-2xl bg-muted px-4 py-2.5">
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
