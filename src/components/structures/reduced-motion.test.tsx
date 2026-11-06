import { fireEvent, render, screen } from "@testing-library/react"
import { beforeAll, describe, expect, it, vi } from "vitest"
import { StackView } from "@/components/structures/stack-view"

beforeAll(() => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === "(prefers-reduced-motion)",
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
})

describe("reduced motion", () => {
  it("does not autoplay a new trace", () => {
    render(<StackView />)

    fireEvent.click(screen.getByRole("button", { name: "Push" }))

    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Pause" })).not.toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent("Step 2 of 2")
  })
})
