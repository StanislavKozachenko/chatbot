export type Theme = "light" | "dark" | "system"

export function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "dark") return "dark"
  if (theme === "light") return "light"
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}
