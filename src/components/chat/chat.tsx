"use client"

import { useState, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { MessageList } from "./message-list"
import { MessageInput } from "./message-input"
import { FileUpload } from "./file-upload"
import { useMessagesSync } from "@/hooks/use-messages-sync"
import { useChats } from "@/hooks/use-chats"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { UIMessage } from "ai"
import type { MessageAttachment } from "@/types"

interface ChatProps {
  chatId: string
  initialMessages: UIMessage[]
  title: string
}

export function Chat({ chatId, initialMessages, title }: ChatProps) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [input, setInput] = useState("")
  const [showAuthModal, setShowAuthModal] = useState(false)

  const { data: chats } = useChats(false)
  const currentTitle = chats?.find((c) => c.id === chatId)?.title ?? title

  const { messages, setMessages, sendMessage, stop, status, error } = useChat({
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

  useEffect(() => {
    if (error?.message.includes("Anonymous limit reached")) {
      setMessages((prev) => prev.slice(0, -1))
      setShowAuthModal(true)
    }
  }, [error])

  useMessagesSync({ chatId, messages, setMessages, isStreaming: isLoading })

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
      <div className="flex h-12 shrink-0 items-center border-b px-4">
        <span className="truncate text-sm font-medium">{currentTitle}</span>
      </div>

      <MessageList messages={messages} isLoading={isLoading} />
      <FileUpload chatId={chatId} />
      <MessageInput
        input={input}
        isLoading={isLoading}
        onInputChange={setInput}
        onSend={handleSend}
        onStop={stop}
      />

      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Free limit reached</DialogTitle>
            <DialogDescription>
              You&apos;ve used your 3 free messages. Create an account to continue chatting.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => router.push("/login")}>
              Log in
            </Button>
            <Button onClick={() => router.push("/register")}>
              Sign up
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
