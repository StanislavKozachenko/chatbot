import { describe, it, expect } from "vitest"
import {
  selectModelId,
  getFirstMessageText,
  VISION_MODEL_ID,
  DEFAULT_MODEL_ID,
} from "./chat"
import type { UIMessage } from "ai"

const makeMessage = (parts: UIMessage["parts"]): UIMessage =>
  ({ id: "1", role: "user", parts } as UIMessage)

const textPart = (text: string) => ({ type: "text" as const, text })
const filePart = () => ({ type: "file" as const, url: "http://x", mediaType: "image/png" })

describe("selectModelId", () => {
  it("returns default model when no messages contain images", () => {
    const messages = [makeMessage([textPart("hello")])]
    expect(selectModelId(messages)).toBe(DEFAULT_MODEL_ID)
  })

  it("returns vision model when any message contains a file part", () => {
    const messages = [makeMessage([textPart("look at this"), filePart()])]
    expect(selectModelId(messages)).toBe(VISION_MODEL_ID)
  })

  it("returns vision model when a non-last message contains a file part", () => {
    const messages = [
      makeMessage([filePart()]),
      makeMessage([textPart("follow-up question")]),
    ]
    expect(selectModelId(messages)).toBe(VISION_MODEL_ID)
  })

  it("returns default model for empty messages array", () => {
    expect(selectModelId([])).toBe(DEFAULT_MODEL_ID)
  })

  it("returns default model for message with only text parts", () => {
    const messages = [
      makeMessage([textPart("first")]),
      makeMessage([textPart("second")]),
    ]
    expect(selectModelId(messages)).toBe(DEFAULT_MODEL_ID)
  })
})

describe("getFirstMessageText", () => {
  it("returns text from the last message's text part", () => {
    const messages = [
      makeMessage([textPart("first")]),
      makeMessage([textPart("last")]),
    ]
    expect(getFirstMessageText(messages)).toBe("last")
  })

  it("returns empty string when last message has no text part", () => {
    const messages = [makeMessage([filePart()])]
    expect(getFirstMessageText(messages)).toBe("")
  })

  it("returns empty string for empty messages array", () => {
    expect(getFirstMessageText([])).toBe("")
  })

  it("returns only text from last message, ignoring earlier messages", () => {
    const messages = [
      makeMessage([textPart("earlier")]),
      makeMessage([textPart("this one")]),
    ]
    expect(getFirstMessageText(messages)).toBe("this one")
  })

  it("extracts text when message has mixed parts", () => {
    const messages = [makeMessage([filePart(), textPart("describe this")])]
    expect(getFirstMessageText(messages)).toBe("describe this")
  })
})
