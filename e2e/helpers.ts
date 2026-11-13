import { Page } from "@playwright/test"
import fs from "fs"
import path from "path"

export async function mockChatAPI(
  page: Page,
  reply = "Test response from assistant.",
  options: { failAfter?: number } = {}
) {
  let callCount = 0
  await page.route("/api/chat", async (route) => {
    callCount++
    if (options.failAfter !== undefined && callCount > options.failAfter) {
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({ error: "Anonymous limit reached" }),
      })
      return
    }
    const sse = (obj: object) => `data: ${JSON.stringify(obj)}\n\n`
    const body = [
      sse({ type: "start", messageId: "msg_test" }),
      sse({ type: "text-start", id: "text_1" }),
      sse({ type: "text-delta", id: "text_1", delta: reply }),
      sse({ type: "text-end", id: "text_1" }),
      sse({ type: "finish", finishReason: "stop" }),
      "data: [DONE]\n\n",
    ].join("")
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      headers: {
        "cache-control": "no-cache",
        "connection": "keep-alive",
        "x-vercel-ai-ui-message-stream": "v1",
      },
      body,
    })
  })
}

export const AUTH_FILE = path.join(__dirname, ".auth", "user.json")

// Reuses the session saved by global-setup.ts instead of signing in again
export async function login(page: Page) {
  const { cookies } = JSON.parse(fs.readFileSync(AUTH_FILE, "utf8"))
  await page.context().addCookies(cookies)
  await page.goto("/")
}

export async function createChat(page: Page, title = "Test Chat"): Promise<string> {
  const res = await page.request.post("/api/chats", { data: { title } })
  const chat = await res.json()
  return chat.id
}

export async function deleteChat(page: Page, chatId: string): Promise<void> {
  await page.request.delete(`/api/chats/${chatId}`)
}
