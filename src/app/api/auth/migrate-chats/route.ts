import { createSessionClient } from "@/lib/supabase/session"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Migrates chats from an anonymous user to the currently authenticated user.
// Called after sign-up when the anonymous session could not be converted in-place.
export async function POST(request: Request) {
  const session = await createSessionClient()
  const {
    data: { user },
  } = await session.auth.getUser()

  if (!user || user.is_anonymous) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { anonymousUserId } = await request.json()
  if (!anonymousUserId || typeof anonymousUserId !== "string") {
    return NextResponse.json({ error: "Missing anonymousUserId" }, { status: 400 })
  }

  // Don't allow migrating from self
  if (anonymousUserId === user.id) {
    return NextResponse.json({ migrated: 0 })
  }

  const db = createServerClient()

  // Verify the source user actually exists and is anonymous.
  // This prevents stealing chats from registered users.
  const { data: sourceUser, error: userError } = await db.auth.admin.getUserById(anonymousUserId)
  if (userError || !sourceUser.user || !sourceUser.user.is_anonymous) {
    return NextResponse.json({ error: "Source user is not anonymous" }, { status: 403 })
  }

  const { data, error } = await db
    .from("chats")
    .update({ user_id: user.id })
    .eq("user_id", anonymousUserId)
    .select("id")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ migrated: data?.length ?? 0 })
}
