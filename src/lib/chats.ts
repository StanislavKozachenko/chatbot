import type { Chat } from "@/types"

export function applyRenameToChats(
  chats: Chat[] | undefined,
  id: string,
  title: string
): Chat[] {
  return chats?.map((c) => (c.id === id ? { ...c, title } : c)) ?? []
}

export function isAnonymousLimitReached(questionsUsed: number | undefined): boolean {
  return (questionsUsed ?? 0) >= 3
}
