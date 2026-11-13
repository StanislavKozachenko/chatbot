import { chromium, type FullConfig } from "@playwright/test"
import fs from "fs"
import path from "path"
import { AUTH_FILE } from "./helpers"

// Signs in once per run and saves the session; tests reuse it via login()
// instead of submitting the form each time (Supabase limits sign-ins per IP).
export default async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use
  const browser = await chromium.launch()
  const page = await browser.newPage({ baseURL })

  await page.goto("/login")
  await page.getByLabel("Email").fill(process.env.TEST_USER_EMAIL!)
  await page.getByLabel("Password").fill(process.env.TEST_USER_PASSWORD!)
  await page.getByRole("button", { name: /log in|sign in/i }).click()
  await page.waitForURL("/", { timeout: 60000 })

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true })
  await page.context().storageState({ path: AUTH_FILE })
  await browser.close()
}
