import { test, expect } from "@playwright/test"
import { login, createChat, deleteChat } from "../helpers"

test.describe("API /api/chat (guards)", () => {
  test("POST returns 401 without auth", async ({ page }) => {
    const res = await page.request.post("/api/chat", {
      data: { message: null, chatId: "test" },
    })
    expect(res.status()).toBe(401)
  })

  test.describe("authenticated", () => {
    test.beforeEach(async ({ page }) => {
      await login(page)
    })

    test("POST returns 404 for non-existent chat", async ({ page }) => {
      const res = await page.request.post("/api/chat", {
        data: {
          message: { id: "1", role: "user", parts: [{ type: "text", text: "hi" }] },
          chatId: "00000000-0000-0000-0000-000000000000",
        },
      })
      expect(res.status()).toBe(404)
    })

    test("POST returns 404 for another user's chat", async ({ page }) => {
      // Using a valid-format but non-owned UUID
      const res = await page.request.post("/api/chat", {
        data: {
          message: { id: "1", role: "user", parts: [{ type: "text", text: "hi" }] },
          chatId: "11111111-1111-1111-1111-111111111111",
        },
      })
      expect(res.status()).toBe(404)
    })

    test("POST returns 400 for a non-user or missing message", async ({ page }) => {
      const chatId = await createChat(page)
      const forged = await page.request.post("/api/chat", {
        data: {
          message: { id: "1", role: "assistant", parts: [{ type: "text", text: "hi" }] },
          chatId,
        },
      })
      expect(forged.status()).toBe(400)
      const missing = await page.request.post("/api/chat", { data: { chatId } })
      expect(missing.status()).toBe(400)
      await deleteChat(page, chatId)
    })

    test("POST starts streaming for valid chat", async ({ page }) => {
      const chatId = await createChat(page)
      const res = await page.request.post("/api/chat", {
        data: {
          message: { id: "1", role: "user", parts: [{ type: "text", text: "hi" }] },
          chatId,
        },
      })
      expect(res.status()).toBe(200)
      expect(res.headers()["content-type"]).toContain("text/event-stream")
      await deleteChat(page, chatId)
    })
  })
})
