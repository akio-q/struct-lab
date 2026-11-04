import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { QueueCanvas } from "@/components/structures/queue/canvas"
import {
  createQueueState,
  queueSlotId,
  type QueueState,
} from "@/components/structures/queue/engine"
import type { Feedback, Highlight } from "@/lib/structures/types"

function renderCanvas(
  state: QueueState = createQueueState({ capacity: 5, initialValues: [12, 7, 24] }),
  highlights: readonly Highlight[] = [],
  feedback: Feedback = "neutral",
) {
  return render(<QueueCanvas state={state} highlights={highlights} feedback={feedback} />)
}

describe("QueueCanvas", () => {
  it("renders the capacity frame, status, and size", () => {
    renderCanvas()

    expect(screen.getByTestId("queue-capacity")).toHaveTextContent("5")
    expect(screen.getByTestId("queue-status")).toHaveTextContent("open")
    expect(screen.getByTestId("queue-size")).toHaveTextContent("size 3 / 5")
    expect(screen.getByTestId("queue-hint")).toHaveTextContent(
      "Enqueue at the tail; dequeue from the head.",
    )
  })

  it("renders every slot and index from left to right", () => {
    renderCanvas()

    expect(screen.getAllByTestId(/^queue-slot-/)).toHaveLength(5)

    for (let index = 0; index < 5; index += 1) {
      expect(screen.getByTestId(`queue-index-${index}`)).toHaveTextContent(String(index))
      expect(screen.getByTestId(`queue-slot-${index}`)).toBeInTheDocument()
    }

    expect(screen.getByTestId("queue-slot-0")).toHaveAttribute("data-empty", "false")
    expect(screen.getByTestId("queue-slot-2")).toHaveAttribute("data-empty", "false")
    expect(screen.getByTestId("queue-slot-3")).toHaveAttribute("data-empty", "true")
  })

  it("renders values in head-to-tail order with stable item ids", () => {
    const state = createQueueState({ capacity: 5, initialValues: [12, 7, 24] })

    renderCanvas(state)

    expect(screen.getByTestId(`queue-item-${state.items[0].id}`)).toHaveTextContent("12")
    expect(screen.getByTestId(`queue-item-${state.items[1].id}`)).toHaveTextContent("7")
    expect(screen.getByTestId(`queue-item-${state.items[2].id}`)).toHaveTextContent("24")
  })

  it("points at the head and tail items", () => {
    const { rerender } = renderCanvas()

    expect(screen.getByTestId("queue-head")).toHaveAttribute("data-head-index", "0")
    expect(screen.getByTestId("queue-head")).toHaveTextContent("head")
    expect(screen.getByTestId("queue-tail")).toHaveAttribute("data-tail-index", "2")
    expect(screen.getByTestId("queue-tail")).toHaveTextContent("tail")

    rerender(<QueueCanvas state={createQueueState({ capacity: 5 })} />)

    expect(screen.queryByTestId("queue-head")).not.toBeInTheDocument()
    expect(screen.queryByTestId("queue-tail")).not.toBeInTheDocument()
  })

  it("moves the tail tag as the queue grows", () => {
    const { rerender } = renderCanvas(createQueueState({ capacity: 4, initialValues: [1] }))

    expect(screen.getByTestId("queue-tail")).toHaveAttribute("data-tail-index", "0")

    rerender(<QueueCanvas state={createQueueState({ capacity: 4, initialValues: [1, 2] })} />)

    expect(screen.getByTestId("queue-tail")).toHaveAttribute("data-tail-index", "1")
  })

  it("applies item and slot highlight roles", () => {
    const state = createQueueState({ capacity: 5, initialValues: [12, 7, 24] })

    renderCanvas(state, [
      { target: "item", id: state.items[2].id, role: "insert" },
      { target: "slot", id: queueSlotId(0), role: "remove" },
    ])

    const insertSlot = screen.getByTestId("queue-slot-2")
    const removeSlot = screen.getByTestId("queue-slot-0")

    expect(insertSlot).toHaveAttribute("data-highlight", "insert")
    expect(within(insertSlot).getByText("new")).toBeInTheDocument()
    expect(removeSlot).toHaveAttribute("data-highlight", "remove")
    expect(within(removeSlot).getByText("out")).toBeInTheDocument()
    expect(screen.getByTestId("queue-slot-1")).not.toHaveAttribute("data-highlight")
    expect(screen.getByTestId(`queue-item-${state.items[2].id}`)).toHaveAttribute(
      "data-highlight",
      "insert",
    )
  })

  it("lets the strongest highlight win when roles overlap", () => {
    const state = createQueueState({ capacity: 5, initialValues: [12, 7, 24] })

    renderCanvas(state, [
      { target: "item", id: state.items[0].id, role: "active" },
      { target: "slot", id: queueSlotId(0), role: "remove" },
    ])

    expect(screen.getByTestId("queue-slot-0")).toHaveAttribute("data-highlight", "remove")
  })

  it("shows empty and full states with their hints", () => {
    const { rerender } = renderCanvas(createQueueState({ capacity: 3 }))

    expect(screen.getByTestId("queue-status")).toHaveTextContent("empty")
    expect(screen.getByTestId("queue-hint")).toHaveTextContent(
      "Empty queue — enqueue an item to start the line.",
    )
    expect(screen.getByTestId("queue-conveyor")).toHaveAttribute("data-feedback", "neutral")

    rerender(
      <QueueCanvas
        state={createQueueState({ capacity: 2, initialValues: [1, 2] })}
        feedback="error"
      />,
    )

    expect(screen.getByTestId("queue-status")).toHaveTextContent("full")
    expect(screen.getByTestId("queue-hint")).toHaveTextContent("Full queue — enqueue overflows.")
    expect(screen.getByTestId("queue-conveyor")).toHaveAttribute("data-feedback", "error")
  })

  it("makes the conveyor keyboard-scrollable", () => {
    renderCanvas()

    const region = screen.getByRole("region", { name: "Queue conveyor" })

    expect(region).toHaveAttribute("tabindex", "0")
  })

  it("describes the queue for assistive technology", () => {
    const { rerender } = renderCanvas()

    expect(
      screen.getByRole("img", {
        name: "Queue with 3 of 5 slots used; head is 12 at index 0, tail is 24 at index 2. Values from head to tail: 12, 7, 24.",
      }),
    ).toBeInTheDocument()

    rerender(<QueueCanvas state={createQueueState({ capacity: 4 })} />)

    expect(screen.getByRole("img", { name: "Empty queue with capacity 4." })).toBeInTheDocument()
  })

  it("renders more slots when capacity changes", () => {
    const { rerender } = renderCanvas(createQueueState({ capacity: 4 }))

    expect(screen.getAllByTestId(/^queue-slot-/)).toHaveLength(4)

    rerender(<QueueCanvas state={createQueueState({ capacity: 7 })} />)

    expect(screen.getAllByTestId(/^queue-slot-/)).toHaveLength(7)
  })
})
