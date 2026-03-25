"use client"

import { LogOut, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { SidebarItem } from "./sidebar-item"
import { useChats, useCreateChat } from "@/hooks/use-chats"
import { useAuth } from "@/hooks/use-auth"
import { useUser } from "@/hooks/use-user"

function SidebarContent() {
  const { data: chats, isLoading } = useChats()
  const { mutate: createChat, isPending } = useCreateChat()
  const { signOut } = useAuth()
  const user = useUser()

  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <Button
          className="w-full justify-start gap-2"
          variant="outline"
          onClick={() => createChat()}
          disabled={isPending}
        >
          <Plus className="size-4" />
          New chat
        </Button>
      </div>

      <Separator />

      <ScrollArea className="flex-1 px-2 py-2">
        {isLoading ? (
          <div className="space-y-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-md" />
            ))}
          </div>
        ) : !chats?.length ? (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">
            No chats yet
          </p>
        ) : (
          <div className="space-y-0.5">
            {chats.map((chat) => (
              <SidebarItem key={chat.id} chat={chat} />
            ))}
          </div>
        )}
      </ScrollArea>

      <Separator />

      <div className="flex items-center gap-2 p-3">
        <div className="flex-1 truncate">
          <p className="truncate text-xs text-muted-foreground">
            {user?.is_anonymous ? "Guest" : user?.email}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={signOut}>
          <LogOut className="size-4" />
        </Button>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r md:flex md:flex-col">
      <SidebarContent />
    </aside>
  )
}

export function SidebarMobileContent() {
  return <SidebarContent />
}
