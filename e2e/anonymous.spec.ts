import { test, expect } from "@playwright/test"
import { mockChatAPI } from "./helpers"

test.describe("Anonymous flow", () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies to ensure anonymous session
    await page.context().clearCookies()
  })

  test("can send a message as anonymous user", async ({ page }) => {
    await mockChatAPI(page)
    await page.goto("/")
    await page.getByText("Guest").waitFor({ timeout: 10000 })
    await page.locator("aside").getByRole("button", { name: /new chat/i }).click()
    await page.waitForURL(/\/chat\//)

    await page.getByPlaceholder("Message...").fill("Hello")
    await page.keyboard.press("Enter")

    await expect(page.getByText("Hello")).toBeVisible()
  })

  test("shows auth modal after 3 messages", async ({ page }) => {
    await mockChatAPI(page, "Test response from assistant.", { failAfter: 3 })
    await page.goto("/")
    await page.getByText("Guest").waitFor({ timeout: 10000 })

    for (let i = 0; i < 3; i++) {
      await page.locator("aside").getByRole("button", { name: /new chat/i }).click()
      await page.waitForURL(/\/chat\//)
      await page.getByPlaceholder("Message...").fill(`Message ${i + 1}`)
      await page.keyboard.press("Enter")
      await expect(page.getByText(`Message ${i + 1}`)).toBeVisible()
      await page.goto("/")
      await page.getByText("Guest").waitFor({ timeout: 10000 })
    }

    await page.locator("aside").getByRole("button", { name: /new chat/i }).click()
    await page.waitForURL(/\/chat\//)
    await page.getByPlaceholder("Message...").fill("This should be blocked")
    await page.keyboard.press("Enter")

    await expect(page.getByText(/free limit reached/i)).toBeVisible()
  })
})
