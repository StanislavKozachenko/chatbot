import { notFound, redirect } from "next/navigation"
import { createSessionClient } from "@/lib/supabase/session"
import { createServerClient } from "@/lib/supabase/server"
import { Chat } from "@/components/chat/chat"
import type { UIMessage } from "ai"

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const session = await createSessionClient()
  const {
    data: { user },
  } = await session.auth.getUser()
  if (!user) redirect("/login")

  const db = createServerClient()

  const { data: chat } = await db
    .from("chats")
    .select("*")
    .eq("id", id)
    .single()

  if (!chat || chat.user_id !== user.id) notFound()

  const { data: dbMessages } = await db
    .from("messages")
    .select("*")
    .eq("chat_id", id)
    .order("created_at", { ascending: true })

  const initialMessages: UIMessage[] = (dbMessages ?? []).map((msg) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant",
    parts: msg.parts,
  }))

  return <Chat chatId={id} initialMessages={initialMessages} />
}
