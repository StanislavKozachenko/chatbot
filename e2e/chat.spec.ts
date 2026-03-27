import { test, expect } from "@playwright/test"
import { mockChatAPI, login } from "./helpers"

test.describe("Chat", () => {
  test.beforeEach(async ({ page }) => {
    await mockChatAPI(page)
    await login(page)
  })

  test("creates a new chat", async ({ page }) => {
    await page.locator("aside").getByRole("button", { name: /new chat/i }).click()
    await page.waitForURL(/\/chat\//)
    await expect(page.locator("textarea[placeholder='Message...']")).toBeVisible()
  })

  test("sends a message and receives response", async ({ page }) => {
    await page.locator("aside").getByRole("button", { name: /new chat/i }).click()
    await page.waitForURL(/\/chat\//)

    await page.getByPlaceholder("Message...").fill("Hello there")
    await page.keyboard.press("Enter")

    await expect(page.getByText("Hello there")).toBeVisible()
    await expect(page.getByText("Test response from assistant.")).toBeVisible()
  })

  test("can rename a chat from sidebar", async ({ page }) => {
    await page.locator("aside").getByRole("button", { name: /new chat/i }).click()
    await page.waitForURL(/\/chat\//)

    await page.getByPlaceholder("Message...").fill("Hi")
    await page.keyboard.press("Enter")
    await expect(page.getByText("Hi")).toBeVisible()

    const chatItem = page.locator("[data-testid='sidebar-item']").first()
    await chatItem.hover()
    await chatItem.getByLabel("Rename").click()

    // After clicking Rename, the item re-renders in editing state (no data-testid)
    const input = page.locator("aside input").first()
    await input.clear()
    await input.fill("My Renamed Chat")
    await page.getByLabel("Save").click()

    await expect(page.locator("aside").getByText("My Renamed Chat")).toBeVisible()
  })

  test("can delete a chat from sidebar", async ({ page }) => {
    await page.locator("aside").getByRole("button", { name: /new chat/i }).click()
    await page.waitForURL(/\/chat\//)

    const chatId = page.url().split("/chat/")[1]

    const chatItem = page.locator("[data-testid='sidebar-item']").first()
    await chatItem.hover()
    await chatItem.getByLabel("Delete").click()

    await page.waitForURL("/")
    await expect(page).not.toHaveURL(`/chat/${chatId}`)
  })
})
