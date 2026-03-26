"use client"

import { useEffect, useState } from "react"

type Theme = "light" | "dark" | "system"

function resolve(theme: Theme): "light" | "dark" {
  if (theme === "dark") return "dark"
  if (theme === "light") return "light"
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function useTheme() {
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    const stored = (localStorage.getItem("theme") as Theme) || "system"
    setResolvedTheme(resolve(stored))
  }, [])

  const setTheme = (theme: Theme) => {
    localStorage.setItem("theme", theme)
    const resolved = resolve(theme)
    document.documentElement.classList.toggle("dark", resolved === "dark")
    setResolvedTheme(resolved)
  }

  return { resolvedTheme, setTheme }
}
