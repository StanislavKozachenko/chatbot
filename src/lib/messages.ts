import type { Message } from "@/types"

export interface UIMessageRow {
  id: string
  role: "user" | "assistant"
  parts: Message["parts"]
}

export function mapDbMessagesToUI(messages: Message[] | null): UIMessageRow[] {
  return (messages ?? []).map((msg) => ({
    id: msg.id,
    role: msg.role,
    parts: msg.parts,
  }))
}
