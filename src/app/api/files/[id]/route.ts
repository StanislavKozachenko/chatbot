import { createSessionClient } from "@/lib/supabase/session"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const session = await createSessionClient()
  const {
    data: { user },
  } = await session.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const db = createServerClient()

  const { data: file } = await db.from("files").select("user_id, storage_path").eq("id", id).single()
  if (!file || file.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await db.storage.from("files").remove([file.storage_path])
  const { error } = await db.from("files").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
