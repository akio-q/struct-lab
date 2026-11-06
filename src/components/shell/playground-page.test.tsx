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

  it("makes the skip-link target focusable and names the main landmark", () => {
    render(<PlaygroundPage />)

    const main = screen.getByRole("main")

    expect(main).toHaveAttribute("id", "main-content")
    expect(main).toHaveAttribute("tabindex", "-1")
    expect(main).toHaveAttribute("aria-labelledby", "playground-title")
    expect(document.getElementById("playground-title")).toHaveTextContent("Structure Playground")
  })
})
