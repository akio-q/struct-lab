import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { StackView } from "@/components/structures/stack-view"

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

describe("StackView", () => {
  it("renders the stack stage, controls, and inspector", () => {
    render(<StackView />)

    expect(screen.getByRole("heading", { name: "Stack" })).toBeVisible()
    expect(screen.getByTestId("stack-capacity")).toHaveTextContent("6")
    expect(screen.getByTestId("stack-depth")).toHaveTextContent("depth 3 / 6")
    expect(screen.getByLabelText("Value")).toHaveValue(42)

    for (const name of ["Push", "Pop", "Peek", "Clear"]) {
      expect(screen.getByRole("button", { name })).toBeEnabled()
    }

    expect(screen.getByText("Idle")).toBeInTheDocument()
    expect(screen.getByText(/Push, pop, and peek are O\(1\)/)).toBeInTheDocument()

    const inspector = screen.getByRole("complementary", { name: "Stack inspector" })

    expect(within(inspector).getByText("top")).toBeInTheDocument()
    expect(within(inspector).getByText("top index")).toBeInTheDocument()
    expect(within(inspector).getByText("depth")).toBeInTheDocument()
    expect(within(inspector).getByText("free")).toBeInTheDocument()
    expect(within(inspector).getByText("status")).toBeInTheDocument()
    expect(within(inspector).getByText("24")).toBeInTheDocument()
    expect(within(inspector).getByText("2")).toBeInTheDocument()
    expect(within(inspector).getByText("3 / 6")).toBeInTheDocument()
    expect(within(inspector).getByText("3")).toBeInTheDocument()
    expect(within(inspector).getByText("open")).toBeInTheDocument()

    expect(screen.getByText(/No steps yet/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Play" })).toBeDisabled()
  })

  it("pushes a value and records trace frames", () => {
    render(<StackView />)

    fireEvent.change(screen.getByLabelText("Value"), { target: { value: "99" } })
    fireEvent.click(screen.getByRole("button", { name: "Push" }))

    expect(screen.getByTestId("stack-depth")).toHaveTextContent("depth 4 / 6")
    expect(screen.getByTestId("stack-slot-3")).toHaveTextContent("99")
    expect(screen.getByText("push · write")).toBeInTheDocument()
    expect(within(screen.getByRole("list")).getByText("Push 99 onto index 3.")).toBeInTheDocument()
    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument()

    const inspector = screen.getByRole("complementary", { name: "Stack inspector" })

    expect(within(inspector).getByText("99")).toBeInTheDocument()
    expect(within(inspector).getByText("4 / 6")).toBeInTheDocument()
  })

  it("pops the top item and updates the pointer inspector", () => {
    render(<StackView />)

    fireEvent.click(screen.getByRole("button", { name: "Pop" }))
    finishTrace()

    expect(screen.getByTestId("stack-depth")).toHaveTextContent("depth 2 / 6")
    expect(
      within(screen.getByRole("list")).getByText("Popped 24; top is index 1, depth 2 of 6."),
    ).toBeInTheDocument()

    const inspector = screen.getByRole("complementary", { name: "Stack inspector" })

    expect(within(inspector).getByText("7")).toBeInTheDocument()
    expect(within(inspector).getByText("1")).toBeInTheDocument()
    expect(within(inspector).getByText("2 / 6")).toBeInTheDocument()
  })

  it("peeks at the top item without removing it", () => {
    render(<StackView />)

    fireEvent.click(screen.getByRole("button", { name: "Peek" }))

    expect(screen.getByText("peek · peek")).toBeInTheDocument()
    expect(within(screen.getByRole("list")).getByText("Top is index 2: 24.")).toBeInTheDocument()
    expect(screen.getByTestId("stack-depth")).toHaveTextContent("depth 3 / 6")
  })

  it("reports overflow once the stack is full", () => {
    render(<StackView />)

    for (let push = 0; push < 3; push += 1) {
      fireEvent.click(screen.getByRole("button", { name: "Push" }))
      finishTrace()
    }

    expect(screen.getByTestId("stack-depth")).toHaveTextContent("depth 6 / 6")
    expect(screen.getByTestId("stack-status")).toHaveTextContent("full")

    fireEvent.click(screen.getByRole("button", { name: "Push" }))

    expect(screen.getByText("push · overflow")).toBeInTheDocument()
    expect(
      within(screen.getByRole("list")).getByText("Capacity 6 is full; cannot push 42."),
    ).toBeInTheDocument()
    expect(screen.getByTestId("stack-status")).toHaveTextContent("full")

    const inspector = screen.getByRole("complementary", { name: "Stack inspector" })

    expect(within(inspector).getByText("full")).toBeInTheDocument()
    expect(within(inspector).getByText("0")).toBeInTheDocument()
  })

  it("shows an empty state after clearing the stack", () => {
    render(<StackView />)

    fireEvent.click(screen.getByRole("button", { name: "Clear" }))
    finishTrace()

    expect(screen.getByText("The stack is empty.")).toBeInTheDocument()
    expect(screen.getByTestId("stack-depth")).toHaveTextContent("depth 0 / 6")
    expect(screen.getByTestId("stack-status")).toHaveTextContent("empty")
    expect(
      within(screen.getByRole("list")).getByText("Cleared the stack; capacity 6 is unchanged."),
    ).toBeInTheDocument()

    const inspector = screen.getByRole("complementary", { name: "Stack inspector" })

    expect(within(inspector).getByText("null")).toBeInTheDocument()
    expect(within(inspector).getByText("-1")).toBeInTheDocument()
    expect(within(inspector).getByText("0 / 6")).toBeInTheDocument()
    expect(within(inspector).getByText("empty")).toBeInTheDocument()
  })

  it("validates empty numeric input before pushing", () => {
    render(<StackView />)

    fireEvent.change(screen.getByLabelText("Value"), { target: { value: "" } })
    fireEvent.click(screen.getByRole("button", { name: "Push" }))

    expect(screen.getByRole("alert")).toHaveTextContent("Enter a finite number for the value.")
    expect(screen.getByLabelText("Value")).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByLabelText("Value")).toHaveFocus()
    expect(screen.getByText(/No steps yet/)).toBeInTheDocument()
  })

  it("steps and resets the trace with keyboard shortcuts", () => {
    render(<StackView />)

    fireEvent.click(screen.getByRole("button", { name: "Push" }))
    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument()

    fireEvent.keyDown(window, { key: "ArrowRight" })
    expect(screen.getByText("Step 2 of 2")).toBeInTheDocument()

    fireEvent.keyDown(window, { key: "Home" })
    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument()
  })

  it("changes playback speed with the bracket shortcut", () => {
    render(<StackView />)

    fireEvent.keyDown(window, { code: "BracketRight", key: "]" })

    expect(screen.getByRole("button", { name: "1.5×" })).toHaveAttribute("aria-pressed", "true")
  })

  it("announces the current step to assistive technology", () => {
    render(<StackView />)

    fireEvent.click(screen.getByRole("button", { name: "Push" }))

    expect(screen.getByRole("status")).toHaveTextContent(
      "Step 1 of 2: push, write. Push 42 onto index 3.",
    )

    fireEvent.keyDown(window, { key: "ArrowRight" })

    expect(screen.getByRole("status")).toHaveTextContent(
      "Step 2 of 2: push, complete. Pushed 42; top is index 3, depth 4 of 6.",
    )
  })
})
