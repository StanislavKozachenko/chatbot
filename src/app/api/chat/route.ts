import { convertToModelMessages, generateText, streamText } from "ai"
import { google } from "@ai-sdk/google"
import { groq } from "@ai-sdk/groq"
import { createSessionClient } from "@/lib/supabase/session"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { UIMessage } from "ai"
import type { SupabaseClient } from "@supabase/supabase-js"

async function generateChatTitle(
  db: SupabaseClient,
  chatId: string,
  firstMessageText: string
) {
  try {
    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: `Generate a short title (max 6 words) for a chat that starts with: "${firstMessageText}". Reply with only the title, no quotes.`,
    })
    await db.from("chats").update({ title: text.trim() }).eq("id", chatId)
  } catch {}
}

export async function POST(request: Request) {
  const session = await createSessionClient()
  const {
    data: { user },
  } = await session.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { messages, chatId }: { messages: UIMessage[]; chatId: string } =
    await request.json()

  const db = createServerClient()

  const { data: chat } = await db
    .from("chats")
    .select("*")
    .eq("id", chatId)
    .single()

  if (!chat || chat.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const lastMessage = messages[messages.length - 1]
  const isFirstMessage = messages.length === 1
  const firstMessageText =
    lastMessage.parts.find((p) => p.type === "text")?.text ?? ""

  await db.from("messages").insert({
    chat_id: chatId,
    role: "user",
    parts: lastMessage.parts,
    attachments: [],
  })

  const result = streamText({
    model: groq("llama-3.3-70b-versatile"),
    messages: await convertToModelMessages(messages),
    onFinish: async ({ text }) => {
      await db.from("messages").insert({
        chat_id: chatId,
        role: "assistant",
        parts: [{ type: "text", text }],
        attachments: [],
      })
      await db
        .from("chats")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", chatId)
      if (isFirstMessage && chat.title === "New Chat") {
        void generateChatTitle(db, chatId, firstMessageText)
      }
    },
  })

  return result.toUIMessageStreamResponse()
}
