import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { StackCanvas } from "@/components/structures/stack/canvas"
import {
  createStackState,
  stackSlotId,
  type StackState,
} from "@/components/structures/stack/engine"
import type { Feedback, Highlight } from "@/lib/structures/types"

function renderCanvas(
  state: StackState = createStackState({ capacity: 5, initialValues: [12, 7, 24] }),
  highlights: readonly Highlight[] = [],
  feedback: Feedback = "neutral",
) {
  return render(<StackCanvas state={state} highlights={highlights} feedback={feedback} />)
}

describe("StackCanvas", () => {
  it("renders the capacity frame, status, and depth", () => {
    renderCanvas()

    expect(screen.getByTestId("stack-capacity")).toHaveTextContent("5")
    expect(screen.getByTestId("stack-status")).toHaveTextContent("open")
    expect(screen.getByTestId("stack-depth")).toHaveTextContent("depth 3 / 5")
    expect(screen.getByTestId("stack-hint")).toHaveTextContent(
      "Push adds to the top; pop removes the top.",
    )
  })

  it("renders every slot and index from top to bottom", () => {
    renderCanvas()

    expect(screen.getAllByTestId(/^stack-slot-/)).toHaveLength(5)

    for (const index of [4, 3, 2, 1, 0]) {
      expect(screen.getByTestId(`stack-index-${index}`)).toHaveTextContent(String(index))
    }

    expect(screen.getByTestId("stack-slot-2")).toHaveTextContent("24")
    expect(screen.getByTestId("stack-slot-1")).toHaveTextContent("7")
    expect(screen.getByTestId("stack-slot-0")).toHaveTextContent("12")
    expect(screen.getByTestId("stack-slot-2")).toHaveAttribute("data-empty", "false")
    expect(screen.getByTestId("stack-slot-3")).toHaveAttribute("data-empty", "true")
  })

  it("points at the top item and falls back to the base when empty", () => {
    const { rerender } = renderCanvas()

    expect(screen.getByTestId("stack-top")).toHaveAttribute("data-top-index", "2")
    expect(screen.getByTestId("stack-top")).toHaveTextContent("top")

    rerender(<StackCanvas state={createStackState({ capacity: 5 })} />)

    expect(screen.getByTestId("stack-top")).toHaveAttribute("data-top-index", "-1")
  })

  it("applies item and slot highlight roles", () => {
    const state = createStackState({ capacity: 5, initialValues: [12, 7, 24] })

    renderCanvas(state, [
      { target: "item", id: state.items[2].id, role: "active" },
      { target: "slot", id: stackSlotId(3), role: "insert" },
    ])

    const activeSlot = screen.getByTestId("stack-slot-2")
    const insertSlot = screen.getByTestId("stack-slot-3")

    expect(activeSlot).toHaveAttribute("data-highlight", "active")
    expect(within(activeSlot).getByText("now")).toBeInTheDocument()
    expect(insertSlot).toHaveAttribute("data-highlight", "insert")
    expect(within(insertSlot).getByText("new")).toBeInTheDocument()
    expect(screen.getByTestId("stack-slot-1")).not.toHaveAttribute("data-highlight")
  })

  it("lets the strongest highlight win when roles overlap", () => {
    const state = createStackState({ capacity: 5, initialValues: [12, 7, 24] })

    renderCanvas(state, [
      { target: "item", id: state.items[2].id, role: "active" },
      { target: "slot", id: stackSlotId(2), role: "remove" },
    ])

    expect(screen.getByTestId("stack-slot-2")).toHaveAttribute("data-highlight", "remove")
  })

  it("shows empty and full states with their hints", () => {
    const { rerender } = renderCanvas(createStackState({ capacity: 3 }))

    expect(screen.getByTestId("stack-status")).toHaveTextContent("empty")
    expect(screen.getByTestId("stack-hint")).toHaveTextContent(
      "Empty stack — pop and peek underflow.",
    )
    expect(screen.getByTestId("stack-chamber")).toHaveAttribute("data-feedback", "neutral")

    rerender(
      <StackCanvas
        state={createStackState({ capacity: 2, initialValues: [1, 2] })}
        feedback="error"
      />,
    )

    expect(screen.getByTestId("stack-status")).toHaveTextContent("full")
    expect(screen.getByTestId("stack-hint")).toHaveTextContent("Full stack — push overflows.")
    expect(screen.getByTestId("stack-chamber")).toHaveAttribute("data-feedback", "error")
  })

  it("describes the stack for assistive technology", () => {
    const { rerender } = renderCanvas()

    expect(
      screen.getByRole("img", {
        name: /Stack with 3 of 5 slots used; top is 24 at index 2/,
      }),
    ).toBeInTheDocument()

    rerender(<StackCanvas state={createStackState({ capacity: 4 })} />)

    expect(
      screen.getByRole("img", {
        name: "Empty stack with capacity 4; top is -1.",
      }),
    ).toBeInTheDocument()
  })

  it("renders more slots when capacity changes", () => {
    const { rerender } = renderCanvas(createStackState({ capacity: 4 }))

    expect(screen.getAllByTestId(/^stack-slot-/)).toHaveLength(4)

    rerender(<StackCanvas state={createStackState({ capacity: 7 })} />)

    expect(screen.getAllByTestId(/^stack-slot-/)).toHaveLength(7)
  })
})
