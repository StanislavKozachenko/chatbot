import "server-only"
import { extractText as extractPdfText } from "unpdf"
import mammoth from "mammoth"

export async function extractText(buffer: Buffer, fileType: string): Promise<string> {
  switch (fileType) {
    case "application/pdf": {
      const { text } = await extractPdfText(new Uint8Array(buffer))
      return Array.isArray(text) ? text.join("\n\n") : text
    }
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      const result = await mammoth.extractRawText({ buffer })
      return result.value
    }
    case "text/plain":
    case "text/markdown":
      return buffer.toString("utf-8")
    default:
      throw new Error(`Unsupported file type: ${fileType}`)
  }
}
