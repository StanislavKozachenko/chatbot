import { test, expect } from "@playwright/test"
import { login, createChat, deleteChat } from "../helpers"

test.describe("API /api/messages", () => {
  test("GET returns 401 without auth", async ({ page }) => {
    const res = await page.request.get("/api/messages?chatId=test")
    expect(res.status()).toBe(401)
  })

  test.describe("authenticated", () => {
    test.beforeEach(async ({ page }) => {
      await login(page)
    })

    test("GET returns 400 without chatId", async ({ page }) => {
      const res = await page.request.get("/api/messages")
      expect(res.status()).toBe(400)
    })

    test("GET returns 404 for non-existent chat", async ({ page }) => {
      const res = await page.request.get(
        "/api/messages?chatId=00000000-0000-0000-0000-000000000000"
      )
      expect(res.status()).toBe(404)
    })

    test("GET returns empty array for new chat", async ({ page }) => {
      const chatId = await createChat(page)
      const res = await page.request.get(`/api/messages?chatId=${chatId}`)
      expect(res.status()).toBe(200)
      expect(await res.json()).toEqual([])
      await deleteChat(page, chatId)
    })
  })
})
