import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { PlaygroundPage } from "@/components/shell/playground-page"

const searchParams = vi.hoisted(() => ({ current: new URLSearchParams("structure=deque") }))

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams.current,
}))

describe("PlaygroundPage", () => {
  it("renders the shell with the structure from the URL", () => {
    render(<PlaygroundPage />)

    expect(screen.getByRole("heading", { level: 1, name: "Structure Playground" })).toBeVisible()
    expect(screen.getByRole("tab", { name: "Deque" })).toHaveAttribute("aria-selected", "true")
    expect(document.getElementById("structure-panel-deque")).not.toHaveAttribute("aria-hidden")
    expect(document.getElementById("structure-panel-array")).toHaveAttribute("aria-hidden", "true")
  })
})
