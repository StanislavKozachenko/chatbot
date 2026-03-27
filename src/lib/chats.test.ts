import { describe, it, expect } from "vitest"
import { applyRenameToChats, isAnonymousLimitReached } from "./chats"
import type { Chat } from "@/types"

const makeChat = (id: string, title: string): Chat => ({
  id,
  title,
  user_id: "user-1",
  model: "groq/llama-3.3-70b-versatile",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
})

describe("applyRenameToChats", () => {
  it("renames the matching chat", () => {
    const chats = [makeChat("a", "Old"), makeChat("b", "Other")]
    const result = applyRenameToChats(chats, "a", "New")
    expect(result[0].title).toBe("New")
  })

  it("does not modify non-matching chats", () => {
    const chats = [makeChat("a", "First"), makeChat("b", "Second")]
    const result = applyRenameToChats(chats, "a", "Renamed")
    expect(result[1].title).toBe("Second")
    expect(result[1].id).toBe("b")
  })

  it("leaves all chats unchanged when id not found", () => {
    const chats = [makeChat("a", "Only")]
    const result = applyRenameToChats(chats, "nonexistent", "New")
    expect(result[0].title).toBe("Only")
  })

  it("returns empty array for undefined input", () => {
    expect(applyRenameToChats(undefined, "a", "New")).toEqual([])
  })

  it("returns empty array for empty input", () => {
    expect(applyRenameToChats([], "a", "New")).toEqual([])
  })

  it("preserves all other fields on the renamed chat", () => {
    const chat = makeChat("a", "Original")
    const [result] = applyRenameToChats([chat], "a", "Renamed")
    expect(result).toMatchObject({
      id: "a",
      user_id: "user-1",
      model: "groq/llama-3.3-70b-versatile",
      title: "Renamed",
    })
  })

  it("does not mutate the original array", () => {
    const chats = [makeChat("a", "Original")]
    applyRenameToChats(chats, "a", "Renamed")
    expect(chats[0].title).toBe("Original")
  })
})

describe("isAnonymousLimitReached", () => {
  it("returns false when questionsUsed is undefined (new profile)", () => {
    expect(isAnonymousLimitReached(undefined)).toBe(false)
  })

  it("returns false at 0 questions", () => {
    expect(isAnonymousLimitReached(0)).toBe(false)
  })

  it("returns false at 1 question", () => {
    expect(isAnonymousLimitReached(1)).toBe(false)
  })

  it("returns false at 2 questions", () => {
    expect(isAnonymousLimitReached(2)).toBe(false)
  })

  it("returns true at exactly 3 questions (boundary)", () => {
    expect(isAnonymousLimitReached(3)).toBe(true)
  })

  it("returns true when questionsUsed exceeds limit", () => {
    expect(isAnonymousLimitReached(100)).toBe(true)
  })
})
