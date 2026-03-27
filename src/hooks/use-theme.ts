"use client"

import { useEffect, useState } from "react"
import { resolveTheme, type Theme } from "@/lib/theme"

export function useTheme() {
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    const stored = (localStorage.getItem("theme") as Theme) || "system"
    setResolvedTheme(resolveTheme(stored))
  }, [])

  const setTheme = (theme: Theme) => {
    localStorage.setItem("theme", theme)
    const resolved = resolveTheme(theme)
    document.documentElement.classList.toggle("dark", resolved === "dark")
    setResolvedTheme(resolved)
  }

  return { resolvedTheme, setTheme }
}
