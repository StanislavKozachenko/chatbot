import { describe, it, expect } from "vitest"
import {
  selectModelId,
  getFirstMessageText,
  VISION_MODEL_ID,
  DEFAULT_MODEL_ID,
  parseUserMessage,
  MAX_TEXT_LENGTH,
  MAX_IMAGES,
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

describe("parseUserMessage", () => {
  const base = "https://project.supabase.co/storage/v1/object/public/attachments/"
  const image = { type: "file", url: `${base}u/1.png`, mediaType: "image/png", filename: "1.png" }
  const parse = (input: unknown) => parseUserMessage(input, base)

  it("accepts a text message", () => {
    expect(parse({ id: "1", role: "user", parts: [textPart("hi")] })).toEqual({
      id: "1",
      role: "user",
      parts: [textPart("hi")],
    })
  })

  it("accepts an image from the attachments bucket", () => {
    expect(parse({ id: "1", role: "user", parts: [image] })?.parts).toEqual([image])
  })

  it("rejects assistant and system roles", () => {
    expect(parse({ id: "1", role: "assistant", parts: [textPart("hi")] })).toBeNull()
    expect(parse({ id: "1", role: "system", parts: [textPart("hi")] })).toBeNull()
  })

  it("rejects images from other hosts", () => {
    expect(
      parse({ id: "1", role: "user", parts: [{ ...image, url: "https://evil.example/x.png" }] })
    ).toBeNull()
  })

  it("rejects non-image files", () => {
    expect(parse({ id: "1", role: "user", parts: [{ ...image, mediaType: "text/html" }] })).toBeNull()
  })

  it("rejects unknown part types", () => {
    expect(parse({ id: "1", role: "user", parts: [{ type: "tool-call" }] })).toBeNull()
  })

  it("rejects text over the length limit", () => {
    expect(parse({ id: "1", role: "user", parts: [textPart("a".repeat(MAX_TEXT_LENGTH + 1))] })).toBeNull()
  })

  it("rejects too many images", () => {
    expect(parse({ id: "1", role: "user", parts: Array(MAX_IMAGES + 1).fill(image) })).toBeNull()
  })

  it("rejects empty and malformed input", () => {
    expect(parse(null)).toBeNull()
    expect(parse({ id: "1", role: "user", parts: [] })).toBeNull()
    expect(parse({ id: "1", role: "user", parts: [textPart("")] })).toBeNull()
    expect(parse({ role: "user", parts: [textPart("hi")] })).toBeNull()
  })

  it("drops unexpected fields from parts", () => {
    const result = parse({ id: "1", role: "user", parts: [{ ...textPart("hi"), providerMetadata: { x: 1 } }] })
    expect(result?.parts).toEqual([textPart("hi")])
  })
})
