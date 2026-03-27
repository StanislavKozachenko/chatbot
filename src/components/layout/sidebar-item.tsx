"use client"

import { useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Check, Pencil, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDeleteChat, useRenameChat } from "@/hooks/use-chats"
import { cn } from "@/lib/utils"
import type { Chat } from "@/types"

export function SidebarItem({ chat }: { chat: Chat }) {
  const pathname = usePathname()
  const router = useRouter()
  const isActive = pathname === `/chat/${chat.id}`
  const { mutate: deleteChat, isPending: isDeleting } = useDeleteChat()
  const { mutate: renameChat } = useRenameChat()

  const [editing, setEditing] = useState(false)
  const [titleValue, setTitleValue] = useState(chat.title)
  const inputRef = useRef<HTMLInputElement>(null)

  const startEditing = (e: React.MouseEvent) => {
    e.preventDefault()
    setTitleValue(chat.title)
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const handleSave = () => {
    setEditing(false)
    const trimmed = titleValue.trim()
    if (!trimmed || trimmed === chat.title) return
    renameChat({ id: chat.id, title: trimmed })
  }

  const handleCancel = () => {
    setTitleValue(chat.title)
    setEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave()
    if (e.key === "Escape") handleCancel()
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1 rounded-md bg-accent px-2 py-1.5 text-sm">
        <input
          ref={inputRef}
          value={titleValue}
          onChange={(e) => setTitleValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-0 bg-transparent text-accent-foreground outline-none"
          autoFocus
        />
        <button
          onClick={handleSave}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Save"
        >
          <Check className="size-3.5" />
        </button>
        <button
          onClick={handleCancel}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Cancel"
        >
          <X className="size-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div
      data-testid="sidebar-item"
      className={cn(
        "group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Link href={`/chat/${chat.id}`} className="flex-1 truncate">
        {chat.title}
      </Link>
      <button
        onClick={startEditing}
        className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-colors p-0.5"
        aria-label="Rename"
      >
        <Pencil className="size-3.5" />
      </button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Delete"
        className="size-6 shrink-0 opacity-0 group-hover:opacity-100"
        disabled={isDeleting}
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
