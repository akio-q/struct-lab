import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { DequeCanvas } from "@/components/structures/deque/canvas"
import {
  createDequeState,
  dequeSlotId,
  type DequeState,
} from "@/components/structures/deque/engine"
import type { Feedback, Highlight } from "@/lib/structures/types"

function renderCanvas(
  state: DequeState = createDequeState({ capacity: 5, initialValues: [12, 7, 24] }),
  highlights: readonly Highlight[] = [],
  feedback: Feedback = "neutral",
) {
  return render(<DequeCanvas state={state} highlights={highlights} feedback={feedback} />)
}

describe("DequeCanvas", () => {
  it("renders the capacity frame, status, and size", () => {
    renderCanvas()

    expect(screen.getByTestId("deque-capacity")).toHaveTextContent("5")
    expect(screen.getByTestId("deque-status")).toHaveTextContent("open")
    expect(screen.getByTestId("deque-size")).toHaveTextContent("size 3 / 5")
    expect(screen.getByTestId("deque-hint")).toHaveTextContent("Push and pop at the front or back.")
  })

  it("renders every slot and index from left to right", () => {
    renderCanvas()

    expect(screen.getAllByTestId(/^deque-slot-/)).toHaveLength(5)

    for (let index = 0; index < 5; index += 1) {
      expect(screen.getByTestId(`deque-index-${index}`)).toHaveTextContent(String(index))
      expect(screen.getByTestId(`deque-slot-${index}`)).toBeInTheDocument()
    }

    expect(screen.getByTestId("deque-slot-0")).toHaveAttribute("data-empty", "false")
    expect(screen.getByTestId("deque-slot-2")).toHaveAttribute("data-empty", "false")
    expect(screen.getByTestId("deque-slot-3")).toHaveAttribute("data-empty", "true")
  })

  it("renders values from front to back with stable item ids", () => {
    const state = createDequeState({ capacity: 5, initialValues: [12, 7, 24] })

    renderCanvas(state)

    expect(screen.getByTestId(`deque-item-${state.items[0].id}`)).toHaveTextContent("12")
    expect(screen.getByTestId(`deque-item-${state.items[1].id}`)).toHaveTextContent("7")
    expect(screen.getByTestId(`deque-item-${state.items[2].id}`)).toHaveTextContent("24")
  })

  it("points at the front and back items", () => {
    const { rerender } = renderCanvas()

    expect(screen.getByTestId("deque-front")).toHaveAttribute("data-front-index", "0")
    expect(screen.getByTestId("deque-front")).toHaveTextContent("front")
    expect(screen.getByTestId("deque-back")).toHaveAttribute("data-back-index", "2")
    expect(screen.getByTestId("deque-back")).toHaveTextContent("back")

    rerender(<DequeCanvas state={createDequeState({ capacity: 5 })} />)

    expect(screen.queryByTestId("deque-front")).not.toBeInTheDocument()
    expect(screen.queryByTestId("deque-back")).not.toBeInTheDocument()
  })

  it("keeps both pointers on a single-item deque", () => {
    renderCanvas(createDequeState({ capacity: 4, initialValues: [1] }))

    expect(screen.getByTestId("deque-front")).toHaveAttribute("data-front-index", "0")
    expect(screen.getByTestId("deque-back")).toHaveAttribute("data-back-index", "0")
  })

  it("moves the back tag as the deque grows", () => {
    const { rerender } = renderCanvas(createDequeState({ capacity: 4, initialValues: [1] }))

    expect(screen.getByTestId("deque-back")).toHaveAttribute("data-back-index", "0")

    rerender(<DequeCanvas state={createDequeState({ capacity: 4, initialValues: [1, 2] })} />)

    expect(screen.getByTestId("deque-back")).toHaveAttribute("data-back-index", "1")
  })

  it("applies item and slot highlight roles", () => {
    const state = createDequeState({ capacity: 5, initialValues: [12, 7, 24] })

    renderCanvas(state, [
      { target: "item", id: state.items[0].id, role: "insert" },
      { target: "slot", id: dequeSlotId(2), role: "remove" },
    ])

    const insertSlot = screen.getByTestId("deque-slot-0")
    const removeSlot = screen.getByTestId("deque-slot-2")

    expect(insertSlot).toHaveAttribute("data-highlight", "insert")
    expect(within(insertSlot).getByText("new")).toBeInTheDocument()
    expect(removeSlot).toHaveAttribute("data-highlight", "remove")
    expect(within(removeSlot).getByText("out")).toBeInTheDocument()
    expect(screen.getByTestId("deque-slot-1")).not.toHaveAttribute("data-highlight")
    expect(screen.getByTestId(`deque-item-${state.items[0].id}`)).toHaveAttribute(
      "data-highlight",
      "insert",
    )
  })

  it("lets the strongest highlight win when roles overlap", () => {
    const state = createDequeState({ capacity: 5, initialValues: [12, 7, 24] })

    renderCanvas(state, [
      { target: "item", id: state.items[0].id, role: "active" },
      { target: "slot", id: dequeSlotId(0), role: "remove" },
    ])

    expect(screen.getByTestId("deque-slot-0")).toHaveAttribute("data-highlight", "remove")
  })

  it("shows empty and full states with their hints", () => {
    const { rerender } = renderCanvas(createDequeState({ capacity: 3 }))

    expect(screen.getByTestId("deque-status")).toHaveTextContent("empty")
    expect(screen.getByTestId("deque-hint")).toHaveTextContent(
      "Empty deque — push to either end to start the pipeline.",
    )
    expect(screen.getByTestId("deque-conveyor")).toHaveAttribute("data-feedback", "neutral")

    rerender(
      <DequeCanvas
        state={createDequeState({ capacity: 2, initialValues: [1, 2] })}
        feedback="error"
      />,
    )

    expect(screen.getByTestId("deque-status")).toHaveTextContent("full")
    expect(screen.getByTestId("deque-hint")).toHaveTextContent("Full deque — pushes overflow.")
    expect(screen.getByTestId("deque-conveyor")).toHaveAttribute("data-feedback", "error")
  })

  it("makes the conveyor keyboard-scrollable", () => {
    renderCanvas()

    const region = screen.getByRole("region", { name: "Deque conveyor" })

    expect(region).toHaveAttribute("tabindex", "0")
  })

  it("describes the deque for assistive technology", () => {
    const { rerender } = renderCanvas()

    expect(
      screen.getByRole("img", {
        name: "Deque with 3 of 5 slots used; front is 12 at index 0, back is 24 at index 2. Values from front to back: 12, 7, 24.",
      }),
    ).toBeInTheDocument()

    rerender(<DequeCanvas state={createDequeState({ capacity: 4 })} />)

    expect(screen.getByRole("img", { name: "Empty deque with capacity 4." })).toBeInTheDocument()
  })

  it("renders more slots when capacity changes", () => {
    const { rerender } = renderCanvas(createDequeState({ capacity: 4 }))

    expect(screen.getAllByTestId(/^deque-slot-/)).toHaveLength(4)

    rerender(<DequeCanvas state={createDequeState({ capacity: 7 })} />)

    expect(screen.getAllByTestId(/^deque-slot-/)).toHaveLength(7)
  })
})
