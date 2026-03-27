import { describe, it, expect, vi, beforeAll } from "vitest"

vi.mock("unpdf", () => ({
  extractText: vi.fn().mockResolvedValue({ text: ["First page", "Second page"] }),
}))

vi.mock("mammoth", () => ({
  default: {
    extractRawText: vi.fn().mockResolvedValue({ value: "DOCX content" }),
  },
}))

describe("extractText", () => {
  let extractText: (buffer: Buffer, fileType: string) => Promise<string>

  beforeAll(async () => {
    const mod = await import("./extract-text")
    extractText = mod.extractText
  })

  it("returns plain text verbatim", async () => {
    const content = "Hello, world!"
    const result = await extractText(Buffer.from(content), "text/plain")
    expect(result).toBe(content)
  })

  it("returns markdown verbatim", async () => {
    const content = "# Title\n\nParagraph"
    const result = await extractText(Buffer.from(content), "text/markdown")
    expect(result).toBe(content)
  })

  it("extracts PDF and joins pages with double newline", async () => {
    const result = await extractText(Buffer.from("fake pdf"), "application/pdf")
    expect(result).toBe("First page\n\nSecond page")
  })

  it("handles PDF where text is a string (not array)", async () => {
    const { extractText: mockExtract } = await import("unpdf")
    vi.mocked(mockExtract).mockResolvedValueOnce({ text: "Single string" } as never)
    const result = await extractText(Buffer.from("fake pdf"), "application/pdf")
    expect(result).toBe("Single string")
  })

  it("extracts DOCX via mammoth", async () => {
    const result = await extractText(
      Buffer.from("fake docx"),
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
    expect(result).toBe("DOCX content")
  })

  it("throws on unsupported file type", async () => {
    await expect(
      extractText(Buffer.from("data"), "image/png")
    ).rejects.toThrow("Unsupported file type: image/png")
  })
})
