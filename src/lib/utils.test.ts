import { describe, expect, it } from "vitest"
import { cn } from "@/lib/utils"

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("px-2", false && "hidden", "text-sm")).toBe("px-2 text-sm")
  })

  it("resolves conflicting Tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4")
  })
})
