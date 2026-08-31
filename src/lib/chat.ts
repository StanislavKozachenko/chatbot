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
