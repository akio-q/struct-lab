import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { StepLog } from "@/components/structures/shared/step-log"
import type { StepLogEntry } from "@/lib/structures/types"

const entries: StepLogEntry[] = [
  {
    id: "frame-1",
    operation: "push",
    phase: "write",
    detail: "Write 42 at index 0.",
    feedback: "neutral",
  },
  {
    id: "frame-2",
    operation: "append",
    phase: "complete",
    detail: "Append finished.",
    feedback: "success",
  },
  {
    id: "frame-3",
    operation: "pop",
    phase: "error",
    detail: "The array is empty.",
    feedback: "error",
  },
]

describe("StepLog", () => {
  it("renders entries with feedback labels", () => {
    render(<StepLog entries={entries} cursor={0} />)

    expect(screen.getByText("push")).toBeInTheDocument()
    expect(screen.getByText("write")).toBeInTheDocument()
    expect(screen.getByText("Write 42 at index 0.")).toBeInTheDocument()
    expect(screen.getByText("Success")).toBeInTheDocument()
    expect(screen.getByText("Error")).toBeInTheDocument()
  })

  it("marks the current step", () => {
    render(<StepLog entries={entries} cursor={1} />)

    const rows = screen.getAllByRole("listitem")

    expect(rows[0].querySelector("[aria-current='step']")).toBeNull()
    expect(rows[1].querySelector("[aria-current='step']")).not.toBeNull()
  })

  it("selects a step when clicked", () => {
    const onSelect = vi.fn()

    render(<StepLog entries={entries} cursor={0} onSelect={onSelect} />)

    fireEvent.click(screen.getByRole("button", { name: /append finished/i }))

    expect(onSelect).toHaveBeenCalledWith(1)
  })

  it("renders a non-interactive list without a select handler", () => {
    render(<StepLog entries={entries} cursor={0} />)

    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("renders an empty state", () => {
    render(<StepLog entries={[]} cursor={0} />)

    expect(screen.getByText(/No steps yet/)).toBeInTheDocument()
  })
})
