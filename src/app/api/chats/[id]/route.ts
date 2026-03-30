import { createSessionClient } from "@/lib/supabase/session"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { title } = await request.json()

  const session = await createSessionClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const db = createServerClient()
  const { data: chat } = await db.from("chats").select("user_id").eq("id", id).single()
  if (!chat || chat.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const { data: updated } = await db
    .from("chats")
    .update({ title })
    .eq("id", id)
    .select()
    .single()

  return NextResponse.json(updated)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const session = await createSessionClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const db = createServerClient()

  const { data: chat } = await db
    .from("chats")
    .select("user_id")
    .eq("id", id)
    .single()

  if (!chat || chat.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const { data: files } = await db
    .from("files")
    .select("storage_path")
    .eq("chat_id", id)

  if (files && files.length > 0) {
    await db.storage.from("files").remove(files.map((f) => f.storage_path))
  }

  await db.from("chats").delete().eq("id", id)
  return new NextResponse(null, { status: 204 })
}
