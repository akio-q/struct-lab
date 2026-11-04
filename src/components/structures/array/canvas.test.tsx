import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { ArrayCanvas } from "@/components/structures/array/canvas"
import {
  arraySlotId,
  createArrayState,
  type ArrayState,
} from "@/components/structures/array/engine"
import type { Highlight } from "@/lib/structures/types"

function renderCanvas(
  state: ArrayState = createArrayState({ capacity: 6, initialValues: [12, 7, 24] }),
  highlights: readonly Highlight[] = [],
) {
  return render(<ArrayCanvas state={state} highlights={highlights} />)
}

describe("ArrayCanvas", () => {
  it("renders the capacity frame, mode, and length", () => {
    renderCanvas()

    expect(screen.getByTestId("array-capacity")).toHaveTextContent("6")
    expect(screen.getByTestId("array-mode")).toHaveTextContent("dynamic")
    expect(screen.getByTestId("array-length")).toHaveTextContent(/length 3 \/ 6/)
  })

  it("renders every slot and index in the strip", () => {
    renderCanvas()

    expect(screen.getAllByTestId(/^array-slot-/)).toHaveLength(6)

    for (let index = 0; index < 6; index += 1) {
      expect(screen.getByTestId(`array-index-${index}`)).toHaveTextContent(String(index))
      expect(screen.getByTestId(`array-slot-${index}`)).toBeInTheDocument()
    }
  })

  it("renders values in occupied slots and leaves the rest empty", () => {
    const state = createArrayState({ capacity: 6, initialValues: [12, 7, 24] })

    renderCanvas(state)

    expect(screen.getByText("12")).toBeInTheDocument()
    expect(screen.getByText("7")).toBeInTheDocument()
    expect(screen.getByText("24")).toBeInTheDocument()
    expect(screen.getByTestId("array-slot-0")).toHaveAttribute("data-empty", "false")
    expect(screen.getByTestId("array-slot-3")).toHaveAttribute("data-empty", "true")
    expect(screen.getByTestId(`array-item-${state.items[0].id}`)).toBeInTheDocument()
  })

  it("derives slot highlights and role tags from item highlights", () => {
    const state = createArrayState({ capacity: 4, initialValues: [12, 7, 24] })

    renderCanvas(state, [{ target: "item", id: state.items[1].id, role: "source" }])

    expect(screen.getByTestId("array-slot-1")).toHaveAttribute("data-highlight", "source")
    expect(screen.getByTestId("array-index-1")).toHaveAttribute("data-highlight", "source")
    expect(screen.getByTestId("array-index-1")).toHaveTextContent("src")
  })

  it("lets removal win when slot and item highlights overlap", () => {
    const state = createArrayState({ capacity: 4, initialValues: [12, 7] })

    renderCanvas(state, [
      { target: "slot", id: arraySlotId(0), role: "active" },
      { target: "item", id: state.items[0].id, role: "remove" },
    ])

    expect(screen.getByTestId("array-slot-0")).toHaveAttribute("data-highlight", "remove")
    expect(screen.getByTestId("array-index-0")).toHaveTextContent("out")
  })

  it("summarizes the array for assistive technology", () => {
    renderCanvas()

    expect(
      screen.getByRole("img", {
        name: "Dynamic array with 3 of 6 slots used: 12, 7, 24.",
      }),
    ).toBeInTheDocument()
  })

  it("summarizes an empty array", () => {
    renderCanvas(createArrayState({ capacity: 4 }))

    expect(
      screen.getByRole("img", { name: "Dynamic array with 4 empty slots." }),
    ).toBeInTheDocument()
    expect(screen.getByTestId("array-slot-0")).toHaveAttribute("data-empty", "true")
  })

  it("renders the new capacity when the buffer grows", () => {
    const initial = createArrayState({ capacity: 4, initialValues: [1, 2, 3, 4] })
    const { rerender } = render(<ArrayCanvas state={initial} />)

    expect(screen.getAllByTestId(/^array-slot-/)).toHaveLength(4)

    rerender(<ArrayCanvas state={{ ...initial, capacity: 8 }} />)

    expect(screen.getAllByTestId(/^array-slot-/)).toHaveLength(8)
    expect(screen.getByTestId("array-capacity")).toHaveTextContent("8")
    expect(screen.getByTestId("array-slot-7")).toHaveAttribute("data-empty", "true")
  })

  it("shows a static mode badge", () => {
    renderCanvas(createArrayState({ mode: "static", capacity: 3, initialValues: [1, 2] }))

    expect(screen.getByTestId("array-mode")).toHaveTextContent("static")
  })
})
