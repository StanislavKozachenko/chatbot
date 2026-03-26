import { convertToModelMessages, embed, generateText, streamText } from "ai"
import { cohere } from "@ai-sdk/cohere"
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
    attachments: lastMessage.parts.filter((p) => p.type === "file"),
  })

  const hasImages = messages.some((m) => m.parts.some((p) => p.type === "file"))
  const model = hasImages
    ? groq("meta-llama/llama-4-scout-17b-16e-instruct")
    : groq("llama-3.3-70b-versatile")

  // RAG: retrieve relevant chunks if files are attached to this chat
  let systemPrompt: string | undefined
  if (firstMessageText) {
    const { data: filesExist } = await db
      .from("files")
      .select("id")
      .eq("chat_id", chatId)
      .limit(1)

    if (filesExist && filesExist.length > 0) {
      try {
        const { embedding } = await embed({
          model: cohere.textEmbeddingModel("embed-english-v3.0"),
          value: firstMessageText,
        })

        const { data: chunks } = await db.rpc("match_file_items", {
          query_embedding: JSON.stringify(embedding),
          match_count: 5,
          match_threshold: 0.3,
          p_chat_id: chatId,
        })

        if (chunks && chunks.length > 0) {
          const context = chunks.map((c: { content: string }) => c.content).join("\n\n---\n\n")
          systemPrompt = `Use the following document context to answer the user's question when relevant:\n\n${context}`
        }
      } catch {}
    }
  }

  const result = streamText({
    model,
    system: systemPrompt,
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
