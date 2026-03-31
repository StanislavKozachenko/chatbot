import { test, expect } from "@playwright/test"
import { login, createChat, deleteChat } from "../helpers"

test.describe("API /api/chats", () => {
  test("GET returns 401 without auth", async ({ page }) => {
    const res = await page.request.get("/api/chats")
    expect(res.status()).toBe(401)
  })

  test("POST returns 401 without auth", async ({ page }) => {
    const res = await page.request.post("/api/chats", { data: {} })
    expect(res.status()).toBe(401)
  })

  test.describe("authenticated", () => {
    test.beforeEach(async ({ page }) => {
      await login(page)
    })

    test("GET returns array of chats", async ({ page }) => {
      const res = await page.request.get("/api/chats")
      expect(res.status()).toBe(200)
      expect(Array.isArray(await res.json())).toBe(true)
    })

    test("POST creates chat with default title", async ({ page }) => {
      const res = await page.request.post("/api/chats", { data: {} })
      expect([200, 201]).toContain(res.status())
      const chat = await res.json()
      expect(chat.id).toBeTruthy()
      expect(chat.title).toBe("New Chat")
      await deleteChat(page, chat.id)
    })

    test("POST creates chat with custom title", async ({ page }) => {
      const res = await page.request.post("/api/chats", { data: { title: "My Chat" } })
      expect(res.status()).toBe(201)
      const chat = await res.json()
      expect(chat.title).toBe("My Chat")
      await deleteChat(page, chat.id)
    })

    test("PATCH renames a chat", async ({ page }) => {
      const chatId = await createChat(page, "Original")
      const res = await page.request.patch(`/api/chats/${chatId}`, {
        data: { title: "Renamed" },
      })
      expect(res.status()).toBe(200)
      const updated = await res.json()
      expect(updated.title).toBe("Renamed")
      await deleteChat(page, chatId)
    })

    test("PATCH returns 404 for non-existent chat", async ({ page }) => {
      const res = await page.request.patch(
        "/api/chats/00000000-0000-0000-0000-000000000000",
        { data: { title: "X" } }
      )
      expect(res.status()).toBe(404)
    })

    test("DELETE removes a chat and returns 204", async ({ page }) => {
      const chatId = await createChat(page)
      const res = await page.request.delete(`/api/chats/${chatId}`)
      expect(res.status()).toBe(204)
    })

    test("DELETE returns 404 for non-existent chat", async ({ page }) => {
      const res = await page.request.delete(
        "/api/chats/00000000-0000-0000-0000-000000000000"
      )
      expect(res.status()).toBe(404)
    })
  })
})
