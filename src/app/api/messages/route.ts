import { createSessionClient } from "@/lib/supabase/session"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const chatId = searchParams.get("chatId")
  if (!chatId) return NextResponse.json({ error: "chatId required" }, { status: 400 })

  const session = await createSessionClient()
  const {
    data: { user },
  } = await session.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const db = createServerClient()

  const { data: chat } = await db
    .from("chats")
    .select("user_id")
    .eq("id", chatId)
    .single()

  if (!chat || chat.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const { data: messages, error } = await db
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const uiMessages = (messages ?? []).map((msg) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant",
    parts: msg.parts,
  }))

  return NextResponse.json(uiMessages)
}
