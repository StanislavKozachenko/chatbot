import { test, expect } from "@playwright/test"
import { login, createChat, deleteChat } from "../helpers"

test.describe("API /api/files", () => {
  test("GET returns 401 without auth", async ({ page }) => {
    const res = await page.request.get("/api/files?chatId=test")
    expect(res.status()).toBe(401)
  })

  test("POST returns 401 without auth", async ({ page }) => {
    const res = await page.request.post("/api/files", {
      multipart: { file: { name: "test.txt", mimeType: "text/plain", buffer: Buffer.from("hi") }, chatId: "test" },
    })
    expect(res.status()).toBe(401)
  })

  test.describe("authenticated", () => {
    test.beforeEach(async ({ page }) => {
      await login(page)
    })

    test("GET returns 400 without chatId", async ({ page }) => {
      const res = await page.request.get("/api/files")
      expect(res.status()).toBe(400)
    })

    test("GET returns 404 for non-existent chat", async ({ page }) => {
      const res = await page.request.get(
        "/api/files?chatId=00000000-0000-0000-0000-000000000000"
      )
      expect(res.status()).toBe(404)
    })

    test("GET returns array for own chat", async ({ page }) => {
      const chatId = await createChat(page)
      const res = await page.request.get(`/api/files?chatId=${chatId}`)
      expect(res.status()).toBe(200)
      expect(Array.isArray(await res.json())).toBe(true)
      await deleteChat(page, chatId)
    })

    test("POST returns 400 without required fields", async ({ page }) => {
      const res = await page.request.post("/api/files", {
        multipart: {},
      })
      expect(res.status()).toBe(400)
    })

    test("POST returns 422 for unsupported file type", async ({ page }) => {
      const chatId = await createChat(page)
      const res = await page.request.post("/api/files", {
        multipart: {
          file: { name: "image.png", mimeType: "image/png", buffer: Buffer.from("fake png data") },
          chatId,
        },
      })
      expect(res.status()).toBe(422)
      await deleteChat(page, chatId)
    })
  })
})
