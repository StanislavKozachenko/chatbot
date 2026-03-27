import { test, expect } from "@playwright/test"

test.describe("Authentication", () => {
  test("can log in with valid credentials", async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel("Email").fill(process.env.TEST_USER_EMAIL!)
    await page.getByLabel("Password").fill(process.env.TEST_USER_PASSWORD!)
    await page.getByRole("button", { name: /log in|sign in/i }).click()

    await page.waitForURL("/")
    await expect(page.getByText(process.env.TEST_USER_EMAIL!)).toBeVisible()
  })

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel("Email").fill("wrong@example.com")
    await page.getByLabel("Password").fill("wrongpassword")
    await page.getByRole("button", { name: /log in|sign in/i }).click()

    await expect(page.getByText(/invalid|incorrect|error/i)).toBeVisible()
  })
})
