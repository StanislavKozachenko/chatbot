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

  test("shows an error and retries a failed reply", async ({ page }) => {
    // First call fails, later calls fall through to the successful mock
    let calls = 0
    await page.route("/api/chat", async (route) => {
      if (++calls === 1) {
        await route.fulfill({ status: 500, contentType: "application/json", body: '{"error":"boom"}' })
      } else {
        await route.fallback()
      }
    })

    await page.locator("aside").getByRole("button", { name: /new chat/i }).click()
    await page.waitForURL(/\/chat\//)
    await page.getByPlaceholder("Message...").fill("Hello there")
    await page.keyboard.press("Enter")

    await expect(page.getByText(/something went wrong/i)).toBeVisible()
    await page.getByRole("button", { name: "Retry" }).click()

    await expect(page.getByText("Test response from assistant.")).toBeVisible()
    await expect(page.getByText(/something went wrong/i)).toHaveCount(0)
    await expect(page.getByText("Hello there")).toHaveCount(1)
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

    await expect(page.locator("aside").getByText("My Renamed Chat").first()).toBeVisible()
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
