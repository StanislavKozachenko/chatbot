"use client"

import { useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { MessageList } from "./message-list"
import { MessageInput } from "./message-input"
import { FileUpload } from "./file-upload"
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
}

export function Chat({ chatId, initialMessages }: ChatProps) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [input, setInput] = useState("")
  const [showAuthModal, setShowAuthModal] = useState(false)

  const { messages, sendMessage, status } = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { chatId },
    }),
    onFinish: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] })
    },
    onError: (error) => {
      if (error.message.includes("Anonymous limit reached")) {
        setShowAuthModal(true)
      }
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
      <FileUpload chatId={chatId} />
      <MessageInput
        input={input}
        isLoading={isLoading}
        onInputChange={setInput}
        onSend={handleSend}
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
