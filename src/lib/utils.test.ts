import { describe, it, expect } from "vitest"
import { cn } from "./utils"

describe("cn", () => {
  it("returns a single class unchanged", () => {
    expect(cn("flex")).toBe("flex")
  })

  it("joins multiple classes", () => {
    expect(cn("flex", "items-center")).toBe("flex items-center")
  })

  it("resolves Tailwind conflicts — last class wins", () => {
    expect(cn("w-4", "w-8")).toBe("w-8")
    expect(cn("text-sm", "text-lg")).toBe("text-lg")
    expect(cn("p-2", "p-4")).toBe("p-4")
  })

  it("resolves conflicts across modifiers independently", () => {
    expect(cn("hover:w-4", "hover:w-8")).toBe("hover:w-8")
  })

  it("keeps non-conflicting classes from both arguments", () => {
    const result = cn("flex w-4", "items-center")
    expect(result).toContain("flex")
    expect(result).toContain("w-4")
    expect(result).toContain("items-center")
  })

  it("filters out falsy values", () => {
    expect(cn("flex", false && "hidden", undefined, null, "")).toBe("flex")
  })

  it("handles conditional object syntax", () => {
    expect(cn({ flex: true, hidden: false })).toBe("flex")
  })

  it("handles array input", () => {
    expect(cn(["flex", "items-center"])).toBe("flex items-center")
  })

  it("returns empty string for no arguments", () => {
    expect(cn()).toBe("")
  })

  it("returns empty string for all falsy arguments", () => {
    expect(cn(false, undefined, null, "")).toBe("")
  })
})
