import { describe, it, expect } from "vitest"
import { mapDbMessagesToUI } from "./messages"
import type { Message } from "@/types"

const makeMessage = (id: string, role: "user" | "assistant", text = "hello"): Message => ({
  id,
  chat_id: "chat-1",
  role,
  parts: [{ type: "text", text }],
  attachments: [],
  created_at: "2024-01-01T00:00:00Z",
})

describe("mapDbMessagesToUI", () => {
  it("maps id, role, and parts from DB row", () => {
    const msg = makeMessage("1", "user", "Hello")
    const [result] = mapDbMessagesToUI([msg])
    expect(result).toEqual({ id: "1", role: "user", parts: msg.parts })
  })

  it("strips DB-only fields from the output", () => {
    const [result] = mapDbMessagesToUI([makeMessage("1", "user")])
    expect(result).not.toHaveProperty("chat_id")
    expect(result).not.toHaveProperty("created_at")
    expect(result).not.toHaveProperty("attachments")
  })

  it("handles empty array", () => {
    expect(mapDbMessagesToUI([])).toEqual([])
  })

  it("handles null input (Supabase returns null when no rows)", () => {
    expect(mapDbMessagesToUI(null)).toEqual([])
  })

  it("preserves message order", () => {
    const msgs = [
      makeMessage("1", "user"),
      makeMessage("2", "assistant"),
      makeMessage("3", "user"),
    ]
    const result = mapDbMessagesToUI(msgs)
    expect(result.map((m) => m.id)).toEqual(["1", "2", "3"])
  })

  it("correctly maps both user and assistant roles", () => {
    const msgs = [makeMessage("1", "user"), makeMessage("2", "assistant")]
    const result = mapDbMessagesToUI(msgs)
    expect(result[0].role).toBe("user")
    expect(result[1].role).toBe("assistant")
  })

  it("preserves parts array reference", () => {
    const msg = makeMessage("1", "user")
    const [result] = mapDbMessagesToUI([msg])
    expect(result.parts).toBe(msg.parts)
  })
})
