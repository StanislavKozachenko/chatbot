import { test, expect } from "@playwright/test"
import { login, createChat, deleteChat } from "./helpers"

test.describe("Realtime sync", () => {
  test("chat changes in one tab appear in another tab without reload", async ({ page, context }) => {
    await login(page)

    const other = await context.newPage()
    await other.goto("/")
    await expect(other.locator("aside")).toBeVisible()

    const title = `Synced ${Date.now()}`
    const chatId = await createChat(page, "Realtime Chat")

    // Rename after the other tab had time to subscribe; either event triggers a refetch
    await page.waitForTimeout(2000)
    await page.request.patch(`/api/chats/${chatId}`, { data: { title } })

    await expect(other.locator("aside").getByText(title)).toBeVisible({ timeout: 15000 })

    await deleteChat(page, chatId)
  })
})
