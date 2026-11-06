import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { TraceAnnouncer } from "@/components/structures/shared/trace-announcer"
import type { TraceFrame } from "@/lib/structures/types"

function frame(): TraceFrame<string> {
  return {
    id: "frame-2",
    state: "state",
    operation: "push",
    phase: "write",
    detail: "Write 42 at index 0.",
    complexity: { time: "O(1)", space: "O(n)", note: "Push is O(1)." },
    highlights: [],
    feedback: "neutral",
  }
}

describe("TraceAnnouncer", () => {
  it("announces the current step and detail", () => {
    render(<TraceAnnouncer frame={frame()} cursor={1} total={3} />)

    expect(screen.getByRole("status")).toHaveTextContent(
      "Step 2 of 3: push, write. Write 42 at index 0.",
    )
  })

  it("stays quiet when there are no frames", () => {
    render(<TraceAnnouncer frame={null} cursor={-1} total={0} />)

    expect(screen.getByRole("status")).toBeEmptyDOMElement()
  })

  it("is polite and atomic", () => {
    render(<TraceAnnouncer frame={frame()} cursor={0} total={1} />)

    const status = screen.getByRole("status")

    expect(status).toHaveAttribute("aria-live", "polite")
    expect(status).toHaveAttribute("aria-atomic", "true")
  })
})
