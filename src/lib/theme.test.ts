import { describe, it, expect, vi, beforeEach } from "vitest"
import { resolveTheme } from "./theme"

function mockMatchMedia(prefersDark: boolean) {
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: prefersDark }))
}

describe("resolveTheme", () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns "dark" for explicit dark theme without checking system', () => {
    const spy = vi.fn()
    vi.stubGlobal("matchMedia", spy)
    expect(resolveTheme("dark")).toBe("dark")
    expect(spy).not.toHaveBeenCalled()
  })

  it('returns "light" for explicit light theme without checking system', () => {
    const spy = vi.fn()
    vi.stubGlobal("matchMedia", spy)
    expect(resolveTheme("light")).toBe("light")
    expect(spy).not.toHaveBeenCalled()
  })

  it('returns "dark" for system theme when OS prefers dark', () => {
    mockMatchMedia(true)
    expect(resolveTheme("system")).toBe("dark")
  })

  it('returns "light" for system theme when OS prefers light', () => {
    mockMatchMedia(false)
    expect(resolveTheme("system")).toBe("light")
  })

  it("queries the correct media feature for system theme", () => {
    const mock = vi.fn().mockReturnValue({ matches: false })
    vi.stubGlobal("matchMedia", mock)
    resolveTheme("system")
    expect(mock).toHaveBeenCalledWith("(prefers-color-scheme: dark)")
  })
})
