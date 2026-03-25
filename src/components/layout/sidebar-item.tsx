"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDeleteChat } from "@/hooks/use-chats"
import { cn } from "@/lib/utils"
import type { Chat } from "@/types"

export function SidebarItem({ chat }: { chat: Chat }) {
  const pathname = usePathname()
  const isActive = pathname === `/chat/${chat.id}`
  const { mutate: deleteChat, isPending } = useDeleteChat()

  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Link href={`/chat/${chat.id}`} className="flex-1 truncate">
        {chat.title}
      </Link>
      <Button
        variant="ghost"
        size="icon"
        className="size-6 shrink-0 opacity-0 group-hover:opacity-100"
        disabled={isPending}
        onClick={(e) => {
          e.preventDefault()
          deleteChat(chat.id)
        }}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  )
}
