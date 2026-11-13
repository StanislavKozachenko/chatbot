import type { UIMessage } from "ai"

export const VISION_MODEL_ID = "meta-llama/llama-4-scout-17b-16e-instruct"
export const DEFAULT_MODEL_ID = "openai/gpt-oss-120b"

export function selectModelId(messages: UIMessage[]): string {
  const hasImages = messages.some((m) => m.parts.some((p) => p.type === "file"))
  return hasImages ? VISION_MODEL_ID : DEFAULT_MODEL_ID
}

export function getFirstMessageText(messages: UIMessage[]): string {
  const last = messages[messages.length - 1]
  return last?.parts.find((p) => p.type === "text")?.text ?? ""
}

export const MAX_TEXT_LENGTH = 10000
export const MAX_IMAGES = 4
export const HISTORY_LIMIT = 30

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Validates the single new message a client sends to /api/chat.
// Returns null when the message is not a well-formed user message.
export function parseUserMessage(input: unknown, attachmentsBaseUrl: string): UIMessage | null {
  if (!input || typeof input !== "object") return null
  const { id, role, parts } = input as { id?: unknown; role?: unknown; parts?: unknown }
  if (typeof id !== "string" || role !== "user" || !Array.isArray(parts) || parts.length === 0) {
    return null
  }

  let textLength = 0
  let images = 0
  const clean: UIMessage["parts"] = []

  for (const part of parts) {
    if (part?.type === "text" && typeof part.text === "string") {
      textLength += part.text.length
      clean.push({ type: "text", text: part.text })
    } else if (
      part?.type === "file" &&
      typeof part.url === "string" &&
      part.url.startsWith(attachmentsBaseUrl) &&
      typeof part.mediaType === "string" &&
      part.mediaType.startsWith("image/")
    ) {
      images++
      clean.push({
        type: "file",
        url: part.url,
        mediaType: part.mediaType,
        ...(typeof part.filename === "string" ? { filename: part.filename } : {}),
      })
    } else {
      return null
    }
  }

  if (textLength > MAX_TEXT_LENGTH || images > MAX_IMAGES) return null
  if (textLength === 0 && images === 0) return null

  // The id is reused as the DB primary key, so it must be a UUID
  return { id: UUID_RE.test(id) ? id : crypto.randomUUID(), role: "user", parts: clean }
}
