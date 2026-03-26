"use client"

import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCreateChat } from "@/hooks/use-chats"

export default function HomePage() {
  const { mutate: createChat, isPending } = useCreateChat()

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <MessageSquare className="size-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">No chat selected</h1>
        <p className="text-sm text-muted-foreground">
          Start a new conversation or select one from the sidebar
        </p>
      </div>
      <Button onClick={() => createChat({})} disabled={isPending}>
        New chat
      </Button>
    </div>
  )
}
