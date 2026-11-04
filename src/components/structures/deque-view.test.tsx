import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { DequeView } from "@/components/structures/deque-view"

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

describe("DequeView", () => {
  it("renders the deque stage, controls, and inspector", () => {
    render(<DequeView />)

    expect(screen.getByRole("heading", { name: "Deque" })).toBeVisible()
    expect(screen.getByTestId("deque-capacity")).toHaveTextContent("6")
    expect(screen.getByTestId("deque-size")).toHaveTextContent("size 3 / 6")
    expect(screen.getByLabelText("Value")).toHaveValue(42)

    for (const name of [
      "Push front",
      "Push back",
      "Pop front",
      "Pop back",
      "Peek front",
      "Peek back",
      "Clear",
    ]) {
      expect(screen.getByRole("button", { name })).toBeEnabled()
    }

    expect(screen.getByText("Idle")).toBeInTheDocument()
    expect(screen.getByText(/Push, pop, and peek at both ends are O\(1\)/)).toBeInTheDocument()

    const inspector = screen.getByRole("complementary", { name: "Deque inspector" })

    expect(within(inspector).getByText("front")).toBeInTheDocument()
    expect(within(inspector).getByText("front index")).toBeInTheDocument()
    expect(within(inspector).getByText("back")).toBeInTheDocument()
    expect(within(inspector).getByText("back index")).toBeInTheDocument()
    expect(within(inspector).getByText("size")).toBeInTheDocument()
    expect(within(inspector).getByText("free")).toBeInTheDocument()
    expect(within(inspector).getByText("status")).toBeInTheDocument()
    expect(within(inspector).getByText("12")).toBeInTheDocument()
    expect(within(inspector).getByText("0")).toBeInTheDocument()
    expect(within(inspector).getByText("24")).toBeInTheDocument()
    expect(within(inspector).getByText("2")).toBeInTheDocument()
    expect(within(inspector).getByText("3 / 6")).toBeInTheDocument()
    expect(within(inspector).getByText("3")).toBeInTheDocument()
    expect(within(inspector).getByText("open")).toBeInTheDocument()

    expect(screen.getByText(/No steps yet/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Play" })).toBeDisabled()
  })

  it("pushes a value to the front and records trace frames", () => {
    render(<DequeView />)

    fireEvent.change(screen.getByLabelText("Value"), { target: { value: "99" } })
    fireEvent.click(screen.getByRole("button", { name: "Push front" }))

    expect(screen.getByTestId("deque-size")).toHaveTextContent("size 4 / 6")
    expect(screen.getByTestId("deque-item-deque-item-3")).toHaveTextContent("99")
    expect(screen.getByText("push front · write")).toBeInTheDocument()
    expect(
      within(screen.getByRole("list")).getByText("Push 99 to the front at index 0."),
    ).toBeInTheDocument()
    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument()

    const inspector = screen.getByRole("complementary", { name: "Deque inspector" })

    expect(within(inspector).getByText("99")).toBeInTheDocument()
    expect(within(inspector).getByText("24")).toBeInTheDocument()
    expect(within(inspector).getByText("3")).toBeInTheDocument()
    expect(within(inspector).getByText("4 / 6")).toBeInTheDocument()
    expect(within(inspector).getByText("2")).toBeInTheDocument()
  })

  it("pushes a value to the back and updates the back pointer", () => {
    render(<DequeView />)

    fireEvent.change(screen.getByLabelText("Value"), { target: { value: "99" } })
    fireEvent.click(screen.getByRole("button", { name: "Push back" }))

    expect(screen.getByTestId("deque-size")).toHaveTextContent("size 4 / 6")
    expect(screen.getByTestId("deque-item-deque-item-3")).toHaveTextContent("99")
    expect(screen.getByText("push back · write")).toBeInTheDocument()
    expect(
      within(screen.getByRole("list")).getByText("Push 99 to the back at index 3."),
    ).toBeInTheDocument()

    const inspector = screen.getByRole("complementary", { name: "Deque inspector" })

    expect(within(inspector).getByText("99")).toBeInTheDocument()
    expect(within(inspector).getByText("3")).toBeInTheDocument()
    expect(within(inspector).getByText("4 / 6")).toBeInTheDocument()
  })

  it("pops the front item and updates the pointers", () => {
    render(<DequeView />)

    fireEvent.click(screen.getByRole("button", { name: "Pop front" }))
    finishTrace()

    expect(screen.getByTestId("deque-size")).toHaveTextContent("size 2 / 6")
    expect(
      within(screen.getByRole("list")).getByText(
        "Popped 12 from the front; front is index 0, back is index 1, size 2 of 6.",
      ),
    ).toBeInTheDocument()

    const inspector = screen.getByRole("complementary", { name: "Deque inspector" })

    expect(within(inspector).getByText("7")).toBeInTheDocument()
    expect(within(inspector).getByText("24")).toBeInTheDocument()
    expect(within(inspector).getByText("1")).toBeInTheDocument()
    expect(within(inspector).getByText("2 / 6")).toBeInTheDocument()
    expect(within(inspector).getByText("4")).toBeInTheDocument()
  })

  it("pops the back item and updates the pointers", () => {
    render(<DequeView />)

    fireEvent.click(screen.getByRole("button", { name: "Pop back" }))
    finishTrace()

    expect(screen.getByTestId("deque-size")).toHaveTextContent("size 2 / 6")
    expect(
      within(screen.getByRole("list")).getByText(
        "Popped 24 from the back; front is index 0, back is index 1, size 2 of 6.",
      ),
    ).toBeInTheDocument()

    const inspector = screen.getByRole("complementary", { name: "Deque inspector" })

    expect(within(inspector).getByText("12")).toBeInTheDocument()
    expect(within(inspector).getByText("7")).toBeInTheDocument()
    expect(within(inspector).getByText("1")).toBeInTheDocument()
    expect(within(inspector).getByText("2 / 6")).toBeInTheDocument()
    expect(within(inspector).getByText("4")).toBeInTheDocument()
  })

  it("peeks at the front item without removing it", () => {
    render(<DequeView />)

    fireEvent.click(screen.getByRole("button", { name: "Peek front" }))

    expect(screen.getByText("peek front · peek")).toBeInTheDocument()
    expect(within(screen.getByRole("list")).getByText("Front is index 0: 12.")).toBeInTheDocument()
    expect(screen.getByTestId("deque-size")).toHaveTextContent("size 3 / 6")
  })

  it("peeks at the back item without removing it", () => {
    render(<DequeView />)

    fireEvent.click(screen.getByRole("button", { name: "Peek back" }))

    expect(screen.getByText("peek back · peek")).toBeInTheDocument()
    expect(within(screen.getByRole("list")).getByText("Back is index 2: 24.")).toBeInTheDocument()
    expect(screen.getByTestId("deque-size")).toHaveTextContent("size 3 / 6")
  })

  it("reports overflow once the deque is full", () => {
    render(<DequeView />)

    for (let push = 0; push < 3; push += 1) {
      fireEvent.click(screen.getByRole("button", { name: "Push back" }))
      finishTrace()
    }

    expect(screen.getByTestId("deque-size")).toHaveTextContent("size 6 / 6")
    expect(screen.getByTestId("deque-status")).toHaveTextContent("full")

    fireEvent.click(screen.getByRole("button", { name: "Push front" }))

    expect(screen.getByText("push front · overflow")).toBeInTheDocument()
    expect(
      within(screen.getByRole("list")).getByText(
        "Capacity 6 is full; cannot push 42 to the front.",
      ),
    ).toBeInTheDocument()
    expect(screen.getByTestId("deque-status")).toHaveTextContent("full")

    const inspector = screen.getByRole("complementary", { name: "Deque inspector" })

    expect(within(inspector).getByText("full")).toBeInTheDocument()
    expect(within(inspector).getByText("free").closest("div")).toHaveTextContent("0")
  })

  it("shows an empty state after clearing the deque", () => {
    render(<DequeView />)

    fireEvent.click(screen.getByRole("button", { name: "Clear" }))
    finishTrace()

    expect(screen.getByText("The deque is empty.")).toBeInTheDocument()
    expect(screen.getByTestId("deque-size")).toHaveTextContent("size 0 / 6")
    expect(screen.getByTestId("deque-status")).toHaveTextContent("empty")
    expect(
      within(screen.getByRole("list")).getByText("Cleared the deque; capacity 6 is unchanged."),
    ).toBeInTheDocument()

    const inspector = screen.getByRole("complementary", { name: "Deque inspector" })

    expect(within(inspector).getAllByText("null")).toHaveLength(2)
    expect(within(inspector).getAllByText("-1")).toHaveLength(2)
    expect(within(inspector).getByText("0 / 6")).toBeInTheDocument()
    expect(within(inspector).getByText("6")).toBeInTheDocument()
    expect(within(inspector).getByText("empty")).toBeInTheDocument()
  })

  it("reports underflow when popping the front of an empty deque", () => {
    render(<DequeView />)

    fireEvent.click(screen.getByRole("button", { name: "Clear" }))
    finishTrace()
    fireEvent.click(screen.getByRole("button", { name: "Pop front" }))

    expect(screen.getByText("pop front · underflow")).toBeInTheDocument()
    expect(
      within(screen.getByRole("list")).getByText("Cannot pop from the front of an empty deque."),
    ).toBeInTheDocument()
    expect(screen.getByTestId("deque-status")).toHaveTextContent("empty")
  })

  it("validates empty numeric input before pushing", () => {
    render(<DequeView />)

    fireEvent.change(screen.getByLabelText("Value"), { target: { value: "" } })
    fireEvent.click(screen.getByRole("button", { name: "Push front" }))

    expect(screen.getByRole("alert")).toHaveTextContent("Enter a finite number for the value.")
    expect(screen.getByLabelText("Value")).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByLabelText("Value")).toHaveFocus()
    expect(screen.getByText(/No steps yet/)).toBeInTheDocument()
  })
})
