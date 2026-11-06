import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { QueueView } from "@/components/structures/queue-view"

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

describe("QueueView", () => {
  it("renders the queue stage, controls, and inspector", () => {
    render(<QueueView />)

    expect(screen.getByRole("heading", { name: "Queue" })).toBeVisible()
    expect(screen.getByTestId("queue-capacity")).toHaveTextContent("6")
    expect(screen.getByTestId("queue-size")).toHaveTextContent("size 3 / 6")
    expect(screen.getByLabelText("Value")).toHaveValue(42)

    for (const name of ["Enqueue", "Dequeue", "Peek", "Clear"]) {
      expect(screen.getByRole("button", { name })).toBeEnabled()
    }

    expect(screen.getByText("Idle")).toBeInTheDocument()
    expect(screen.getByText(/Enqueue, dequeue, and peek are O\(1\)/)).toBeInTheDocument()

    const inspector = screen.getByRole("complementary", { name: "Queue inspector" })

    expect(within(inspector).getByText("head")).toBeInTheDocument()
    expect(within(inspector).getByText("head index")).toBeInTheDocument()
    expect(within(inspector).getByText("tail")).toBeInTheDocument()
    expect(within(inspector).getByText("tail index")).toBeInTheDocument()
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

  it("enqueues a value at the tail and records trace frames", () => {
    render(<QueueView />)

    fireEvent.change(screen.getByLabelText("Value"), { target: { value: "99" } })
    fireEvent.click(screen.getByRole("button", { name: "Enqueue" }))

    expect(screen.getByTestId("queue-size")).toHaveTextContent("size 4 / 6")
    expect(screen.getByTestId("queue-item-queue-item-3")).toHaveTextContent("99")
    expect(screen.getByText("enqueue · write")).toBeInTheDocument()
    expect(within(screen.getByRole("list")).getByText("Enqueue 99 at index 3.")).toBeInTheDocument()
    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument()

    const inspector = screen.getByRole("complementary", { name: "Queue inspector" })

    expect(within(inspector).getByText("99")).toBeInTheDocument()
    expect(within(inspector).getByText("3")).toBeInTheDocument()
    expect(within(inspector).getByText("4 / 6")).toBeInTheDocument()
    expect(within(inspector).getByText("2")).toBeInTheDocument()
  })

  it("dequeues the head item and updates the pointers", () => {
    render(<QueueView />)

    fireEvent.click(screen.getByRole("button", { name: "Dequeue" }))
    finishTrace()

    expect(screen.getByTestId("queue-size")).toHaveTextContent("size 2 / 6")
    expect(
      within(screen.getByRole("list")).getByText(
        "Dequeued 12; head is index 0, tail is index 1, size 2 of 6.",
      ),
    ).toBeInTheDocument()

    const inspector = screen.getByRole("complementary", { name: "Queue inspector" })

    expect(within(inspector).getByText("7")).toBeInTheDocument()
    expect(within(inspector).getByText("24")).toBeInTheDocument()
    expect(within(inspector).getByText("1")).toBeInTheDocument()
    expect(within(inspector).getByText("2 / 6")).toBeInTheDocument()
    expect(within(inspector).getByText("4")).toBeInTheDocument()
  })

  it("peeks at the head item without removing it", () => {
    render(<QueueView />)

    fireEvent.click(screen.getByRole("button", { name: "Peek" }))

    expect(screen.getByText("peek · peek")).toBeInTheDocument()
    expect(within(screen.getByRole("list")).getByText("Head is index 0: 12.")).toBeInTheDocument()
    expect(screen.getByTestId("queue-size")).toHaveTextContent("size 3 / 6")
  })

  it("reports overflow once the queue is full", () => {
    render(<QueueView />)

    for (let enqueue = 0; enqueue < 3; enqueue += 1) {
      fireEvent.click(screen.getByRole("button", { name: "Enqueue" }))
      finishTrace()
    }

    expect(screen.getByTestId("queue-size")).toHaveTextContent("size 6 / 6")
    expect(screen.getByTestId("queue-status")).toHaveTextContent("full")

    fireEvent.click(screen.getByRole("button", { name: "Enqueue" }))

    expect(screen.getByText("enqueue · overflow")).toBeInTheDocument()
    expect(
      within(screen.getByRole("list")).getByText("Capacity 6 is full; cannot enqueue 42."),
    ).toBeInTheDocument()
    expect(screen.getByTestId("queue-status")).toHaveTextContent("full")

    const inspector = screen.getByRole("complementary", { name: "Queue inspector" })

    expect(within(inspector).getByText("full")).toBeInTheDocument()
    expect(within(inspector).getByText("free").closest("div")).toHaveTextContent("0")
  })

  it("shows an empty state after clearing the queue", () => {
    render(<QueueView />)

    fireEvent.click(screen.getByRole("button", { name: "Clear" }))
    finishTrace()

    expect(screen.getByText("The queue is empty.")).toBeInTheDocument()
    expect(screen.getByTestId("queue-size")).toHaveTextContent("size 0 / 6")
    expect(screen.getByTestId("queue-status")).toHaveTextContent("empty")
    expect(
      within(screen.getByRole("list")).getByText("Cleared the queue; capacity 6 is unchanged."),
    ).toBeInTheDocument()

    const inspector = screen.getByRole("complementary", { name: "Queue inspector" })

    expect(within(inspector).getAllByText("null")).toHaveLength(2)
    expect(within(inspector).getAllByText("-1")).toHaveLength(2)
    expect(within(inspector).getByText("0 / 6")).toBeInTheDocument()
    expect(within(inspector).getByText("6")).toBeInTheDocument()
    expect(within(inspector).getByText("empty")).toBeInTheDocument()
  })

  it("reports underflow when dequeuing an empty queue", () => {
    render(<QueueView />)

    fireEvent.click(screen.getByRole("button", { name: "Clear" }))
    finishTrace()
    fireEvent.click(screen.getByRole("button", { name: "Dequeue" }))

    expect(screen.getByText("dequeue · underflow")).toBeInTheDocument()
    expect(
      within(screen.getByRole("list")).getByText("Cannot dequeue from an empty queue."),
    ).toBeInTheDocument()
    expect(screen.getByTestId("queue-status")).toHaveTextContent("empty")
  })

  it("validates empty numeric input before enqueueing", () => {
    render(<QueueView />)

    fireEvent.change(screen.getByLabelText("Value"), { target: { value: "" } })
    fireEvent.click(screen.getByRole("button", { name: "Enqueue" }))

    expect(screen.getByRole("alert")).toHaveTextContent("Enter a finite number for the value.")
    expect(screen.getByLabelText("Value")).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByLabelText("Value")).toHaveFocus()
    expect(screen.getByText(/No steps yet/)).toBeInTheDocument()
  })

  it("changes playback speed with the bracket shortcut", () => {
    render(<QueueView />)

    fireEvent.keyDown(window, { code: "BracketRight", key: "]" })

    expect(screen.getByRole("button", { name: "1.5×" })).toHaveAttribute("aria-pressed", "true")
  })
})
