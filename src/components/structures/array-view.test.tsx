import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { ArrayView } from "@/components/structures/array-view"

function finishTrace() {
  for (let step = 0; step < 20; step += 1) {
    const stepForward = screen.getByRole("button", { name: "Step forward" })

    if (stepForward.hasAttribute("disabled")) {
      return
    }

    fireEvent.click(stepForward)
  }

  throw new Error("Trace did not reach its final frame.")
}

describe("ArrayView", () => {
  it("renders the array stage, controls, and inspector", () => {
    render(<ArrayView />)

    expect(screen.getByRole("heading", { name: "Array" })).toBeVisible()
    expect(screen.getByTestId("array-capacity")).toHaveTextContent("4")
    expect(screen.getByTestId("array-length")).toHaveTextContent("length 3 / 4")
    expect(screen.getByLabelText("Value")).toHaveValue(42)
    expect(screen.getByLabelText("Index")).toHaveValue(0)

    for (const name of ["Append", "Insert", "Access", "Remove", "Pop", "Clear"]) {
      expect(screen.getByRole("button", { name })).toBeEnabled()
    }

    expect(screen.getByRole("button", { name: "Static" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Dynamic" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Dynamic" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByText("Idle")).toBeInTheDocument()
    expect(screen.getByText(/Indexed access is O\(1\)/)).toBeInTheDocument()
    expect(screen.getByText("length")).toBeInTheDocument()
    expect(screen.getByText("capacity")).toBeInTheDocument()
    expect(screen.getByText("free")).toBeInTheDocument()
    expect(screen.getByText("mode")).toBeInTheDocument()
    expect(screen.getByText(/No steps yet/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Play" })).toBeDisabled()
  })

  it("appends a value and records trace frames", () => {
    render(<ArrayView />)

    fireEvent.change(screen.getByLabelText("Value"), { target: { value: "42" } })
    fireEvent.click(screen.getByRole("button", { name: "Append" }))

    expect(screen.getByTestId("array-length")).toHaveTextContent("length 4 / 4")
    expect(screen.getByText("42")).toBeInTheDocument()
    expect(screen.getByText("append · write")).toBeInTheDocument()
    expect(within(screen.getByRole("list")).getByText("Write 42 at index 3.")).toBeInTheDocument()
    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument()
  })

  it("runs insert, access, remove, and pop from the visible frame", () => {
    render(<ArrayView />)

    fireEvent.change(screen.getByLabelText("Value"), { target: { value: "99" } })
    fireEvent.change(screen.getByLabelText("Index"), { target: { value: "1" } })
    fireEvent.click(screen.getByRole("button", { name: "Insert" }))
    finishTrace()

    expect(screen.getByTestId("array-length")).toHaveTextContent("length 4 / 4")
    expect(screen.getByText("99")).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText("Index"), { target: { value: "2" } })
    fireEvent.click(screen.getByRole("button", { name: "Access" }))

    expect(screen.getByText("access · read")).toBeInTheDocument()
    expect(within(screen.getByRole("list")).getByText("items[2] = 7.")).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText("Index"), { target: { value: "0" } })
    fireEvent.click(screen.getByRole("button", { name: "Remove" }))
    finishTrace()

    expect(screen.getByTestId("array-length")).toHaveTextContent("length 3 / 4")
    expect(
      within(screen.getByRole("list")).getByText("Removed 12; length 3 of 4."),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Pop" }))
    finishTrace()

    expect(screen.getByTestId("array-length")).toHaveTextContent("length 2 / 4")
    expect(
      within(screen.getByRole("list")).getByText("Removed 24; length 2 of 4."),
    ).toBeInTheDocument()
  })

  it("reports an out-of-bounds access in the trace", () => {
    render(<ArrayView />)

    fireEvent.change(screen.getByLabelText("Index"), { target: { value: "9" } })
    fireEvent.click(screen.getByRole("button", { name: "Access" }))

    expect(screen.getByText("access · bounds")).toBeInTheDocument()
    expect(
      within(screen.getByRole("list")).getByText("Index 9 is out of bounds (0..2)."),
    ).toBeInTheDocument()
    expect(screen.getByText("O(1)")).toBeInTheDocument()
  })

  it("ignores the already-selected mode", () => {
    render(<ArrayView />)

    fireEvent.click(screen.getByRole("button", { name: "Dynamic" }))

    expect(screen.getByText(/No steps yet/)).toBeInTheDocument()
  })

  it("switches between static and dynamic modes", () => {
    render(<ArrayView />)

    fireEvent.click(screen.getByRole("button", { name: "Static" }))

    expect(screen.getByTestId("array-mode")).toHaveTextContent("static")
    expect(screen.getByRole("button", { name: "Static" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "Static" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Dynamic" })).toHaveAttribute("aria-pressed", "false")
    expect(screen.getByText("mode · configure")).toBeInTheDocument()
  })

  it("shows an empty-state hint after clearing the array", () => {
    render(<ArrayView />)

    fireEvent.click(screen.getByRole("button", { name: "Clear" }))
    finishTrace()

    expect(screen.getByText("The array is empty.")).toBeInTheDocument()
    expect(screen.getByTestId("array-length")).toHaveTextContent("length 0 / 4")
    expect(
      within(screen.getByRole("list")).getByText("Cleared the array; capacity 4 is unchanged."),
    ).toBeInTheDocument()
  })

  it("validates empty numeric input before running an operation", () => {
    render(<ArrayView />)

    fireEvent.change(screen.getByLabelText("Value"), { target: { value: "" } })
    fireEvent.click(screen.getByRole("button", { name: "Append" }))

    expect(screen.getByRole("alert")).toHaveTextContent("Enter a finite number for the value.")
    expect(screen.getByLabelText("Value")).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByText(/No steps yet/)).toBeInTheDocument()
  })
})
