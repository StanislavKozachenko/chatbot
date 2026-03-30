import { createSessionClient } from "@/lib/supabase/session"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { embedMany } from "ai"
import { cohere } from "@ai-sdk/cohere"
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"
import { extractText } from "@/lib/rag/extract-text"

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

  const { data: chat } = await db.from("chats").select("user_id").eq("id", chatId).single()
  if (!chat || chat.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const { data: files, error } = await db
    .from("files")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(files)
}

export async function POST(request: Request) {
  const session = await createSessionClient()
  const {
    data: { user },
  } = await session.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  const chatId = formData.get("chatId") as string | null
  if (!file || !chatId) {
    return NextResponse.json({ error: "file and chatId required" }, { status: 400 })
  }

  const db = createServerClient()

  const { data: chat } = await db.from("chats").select("user_id").eq("id", chatId).single()
  if (!chat || chat.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = file.name.split(".").pop() ?? "bin"
  const storagePath = `${user.id}/${chatId}/${Date.now()}.${ext}`

  const { error: uploadError } = await db.storage
    .from("files")
    .upload(storagePath, buffer, { contentType: file.type })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  let text: string
  try {
    text = await extractText(buffer, file.type)
  } catch (e) {
    console.error("[files] extractText error:", e)
    await db.storage.from("files").remove([storagePath])
    return NextResponse.json({ error: "Failed to extract text from file" }, { status: 422 })
  }

  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 })
  const chunks = await splitter.splitText(text)

  let embeddings: number[][]
  try {
    const result = await embedMany({
      model: cohere.embeddingModel("embed-english-v3.0"),
      values: chunks,
    })
    embeddings = result.embeddings
  } catch (e) {
    console.error("[files] embedMany error:", e)
    await db.storage.from("files").remove([storagePath])
    return NextResponse.json(
      { error: "Embedding service unavailable. Document could not be indexed." },
      { status: 503 }
    )
  }

  const { data: fileRecord, error: fileError } = await db
    .from("files")
    .insert({
      chat_id: chatId,
      user_id: user.id,
      name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: storagePath,
      tokens: chunks.length,
    })
    .select()
    .single()

  if (fileError) return NextResponse.json({ error: fileError.message }, { status: 500 })

  const fileItems = chunks.map((content, i) => ({
    file_id: fileRecord.id,
    chat_id: chatId,
    content,
    embedding: JSON.stringify(embeddings[i]),
    chunk_index: i,
  }))

  const { error: itemsError } = await db.from("file_items").insert(fileItems)
  if (itemsError) {
    await db.from("files").delete().eq("id", fileRecord.id)
    await db.storage.from("files").remove([storagePath])
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  return NextResponse.json(fileRecord, { status: 201 })
}
