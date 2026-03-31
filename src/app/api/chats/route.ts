import { createSessionClient } from "@/lib/supabase/session"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await createSessionClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const db = createServerClient()
  const { data: chats, error } = await db
    .from("chats")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(chats)
}

export async function POST(request: Request) {
  const session = await createSessionClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { title = "New Chat", model = "google/gemini-2.0-flash", deduplicate = false } = body

  const db = createServerClient()

  if (deduplicate) {
    const { data: latestChat } = await db
      .from("chats")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestChat) {
      const { count } = await db
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("chat_id", latestChat.id)

      if (count === 0) return NextResponse.json(latestChat, { status: 200 })
    }
  }

  const { data: chat, error } = await db
    .from("chats")
    .insert({ user_id: user.id, title, model })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(chat, { status: 201 })
}
