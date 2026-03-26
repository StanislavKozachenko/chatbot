"use client"

import { useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useQueryClient } from "@tanstack/react-query"
import { MessageList } from "./message-list"
import { MessageInput } from "./message-input"
import type { UIMessage } from "ai"
import type { MessageAttachment } from "@/types"

interface ChatProps {
  chatId: string
  initialMessages: UIMessage[]
}

export function Chat({ chatId, initialMessages }: ChatProps) {
  const queryClient = useQueryClient()
  const [input, setInput] = useState("")

  const { messages, sendMessage, status } = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { chatId },
    }),
    onFinish: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] })
    },
  })

  const isLoading = status === "submitted" || status === "streaming"

  const handleSend = (attachments: MessageAttachment[]) => {
    if (!input.trim() && !attachments.length) return
    if (isLoading) return

    sendMessage({
      text: input,
      files: attachments.map((a) => ({
        type: "file" as const,
        url: a.url,
        mediaType: a.contentType,
        filename: a.name,
      })),
    })
    setInput("")
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <MessageList messages={messages} isLoading={isLoading} />
      <MessageInput
        input={input}
        isLoading={isLoading}
        onInputChange={setInput}
        onSend={handleSend}
      />
    </div>
  )
}
