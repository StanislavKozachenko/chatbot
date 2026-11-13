import { test, expect, type Page } from "@playwright/test"
import { login, createChat, deleteChat } from "./helpers"

// Resolves once Supabase Realtime confirms the postgres_changes subscription is live
function waitForRealtimeSubscription(page: Page) {
  return new Promise<void>((resolve) => {
    page.on("websocket", (ws) => {
      ws.on("framereceived", ({ payload }) => {
        if (typeof payload === "string" && payload.includes("Subscribed to PostgreSQL")) resolve()
      })
    })
  })
}

test.describe("Realtime sync", () => {
  test("chat changes in one tab appear in another tab without reload", async ({ page, context }) => {
    test.setTimeout(60000)
    await login(page)

    const other = await context.newPage()
    const subscribed = waitForRealtimeSubscription(other)
    await other.goto("/")
    await subscribed

    const chatId = await createChat(page, "Realtime Chat")
    const title = `Synced ${Date.now()}`
    await page.request.patch(`/api/chats/${chatId}`, { data: { title } })

    await expect(other.locator("aside").getByText(title)).toBeVisible({ timeout: 15000 })

    await deleteChat(page, chatId)
  })
})
