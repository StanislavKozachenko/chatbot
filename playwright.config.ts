import { defineConfig, devices } from "@playwright/test"
import dotenv from "dotenv"

dotenv.config({ path: ".env.test" })

const baseURL = process.env.BASE_URL ?? "http://localhost:3000"
const isCI = !!process.env.CI

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: isCI ? 1 : 0,
  workers: 1,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: !process.env.BASE_URL
    ? {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: !isCI,
        timeout: isCI ? 120000 : 60000,
      }
    : undefined,
})
