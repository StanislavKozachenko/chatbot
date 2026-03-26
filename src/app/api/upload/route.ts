import { createSessionClient } from "@/lib/supabase/session"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const session = await createSessionClient()
  const {
    data: { user },
  } = await session.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

  const ext = file.name.split(".").pop() ?? "bin"
  const path = `${user.id}/${Date.now()}.${ext}`
  const buffer = await file.arrayBuffer()

  const db = createServerClient()
  const { error } = await db.storage
    .from("attachments")
    .upload(path, buffer, { contentType: file.type })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const {
    data: { publicUrl },
  } = db.storage.from("attachments").getPublicUrl(path)

  return NextResponse.json({ url: publicUrl, name: file.name, contentType: file.type })
}
