import { convertToModelMessages, embed, generateText, streamText } from "ai"
import { cohere } from "@ai-sdk/cohere"
import { groq } from "@ai-sdk/groq"
import { createSessionClient } from "@/lib/supabase/session"
import { createServerClient } from "@/lib/supabase/server"
import { selectModelId, getFirstMessageText } from "@/lib/chat"
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
  const firstMessageText = getFirstMessageText(messages)

  if (user.is_anonymous) {
    const { data: allowed } = await db.rpc("check_and_increment_questions", {
      p_user_id: user.id,
      p_limit: 3,
    })
    if (!allowed) {
      return NextResponse.json({ error: "Anonymous limit reached" }, { status: 403 })
    }
  }

  await db.from("messages").insert({
    chat_id: chatId,
    role: "user",
    parts: lastMessage.parts,
    attachments: lastMessage.parts.filter((p) => p.type === "file"),
  })

  const model = groq(selectModelId(messages))

  // RAG: retrieve relevant chunks if files are attached to this chat
  const baseInstruction = "Never use dollar signs ($) around words or phrases — do not use LaTeX-style math notation for anything other than actual mathematical expressions."
  let systemPrompt: string = baseInstruction
  const { data: filesExist } = await db
    .from("files")
    .select("id")
    .eq("chat_id", chatId)
    .limit(1)

  if (filesExist && filesExist.length > 0) {
    try {
      const { embedding } = await embed({
        model: cohere.embeddingModel("embed-english-v3.0"),
        value: firstMessageText || "summarize the document",
      })

      const { data: chunks } = await db.rpc("match_file_items", {
        query_embedding: JSON.stringify(embedding),
        match_count: 5,
        match_threshold: 0,
        p_chat_id: chatId,
      })

      if (chunks && chunks.length > 0) {
        const context = chunks.map((c: { content: string }) => c.content).join("\n\n---\n\n")
        systemPrompt = `${baseInstruction}\n\nThe user has attached documents to this conversation. Use the following excerpts as context when answering:\n\n${context}`
      }
    } catch (e) {
      console.error("[chat] RAG embed error:", e)
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
