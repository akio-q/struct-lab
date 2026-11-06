import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import {
  LinkedListCanvas,
  buildLinkedListLinks,
  buildLinkedListPath,
  layoutLinkedListNodes,
  type LinkedListNodeBox,
} from "@/components/structures/linked-list/canvas"
import {
  createLinkedListState,
  linkedListEdgeId,
  type LinkedListState,
} from "@/components/structures/linked-list/engine"
import type { Highlight } from "@/lib/structures/types"

function renderCanvas(
  state: LinkedListState = createLinkedListState({ initialValues: [12, 7, 24] }),
  highlights: readonly Highlight[] = [],
) {
  return render(<LinkedListCanvas state={state} highlights={highlights} />)
}

const fallbackBoxes: LinkedListNodeBox[] = [
  { id: "a", x: 0, y: 0, width: 112, height: 88 },
  { id: "b", x: 168, y: 0, width: 112, height: 88 },
  { id: "c", x: 336, y: 0, width: 112, height: 88 },
]

function stateWithIds(): LinkedListState {
  return {
    nodes: [
      { id: "a", value: 1, address: "0x1000", prevId: null, nextId: "b" },
      { id: "b", value: 2, address: "0x1010", prevId: "a", nextId: "c" },
      { id: "c", value: 3, address: "0x1020", prevId: "b", nextId: null },
    ],
    headId: "a",
    tailId: "c",
    nextNodeId: 4,
    nextAddress: 0x1030,
    nextFrameId: 0,
  }
}

describe("layoutLinkedListNodes", () => {
  it("lays nodes out deterministically with the canvas dimensions", () => {
    const state = createLinkedListState({ initialValues: [1, 2, 3] })

    expect(layoutLinkedListNodes(state.nodes)).toEqual([
      { id: "linked-list-node-1", x: 0, y: 0, width: 112, height: 88 },
      { id: "linked-list-node-2", x: 168, y: 0, width: 112, height: 88 },
      { id: "linked-list-node-3", x: 336, y: 0, width: 112, height: 88 },
    ])
  })
})

describe("buildLinkedListPath", () => {
  it("draws next links along the upper lane, left to right", () => {
    expect(buildLinkedListPath(fallbackBoxes[0], fallbackBoxes[1], "next")).toBe(
      "M 112 32 C 137 32, 137 32, 162 32",
    )
  })

  it("draws prev links along the lower lane, right to left", () => {
    expect(buildLinkedListPath(fallbackBoxes[1], fallbackBoxes[0], "prev")).toBe(
      "M 168 56 C 143 56, 143 56, 118 56",
    )
  })

  it("routes backward next links over the nodes", () => {
    expect(buildLinkedListPath(fallbackBoxes[2], fallbackBoxes[0], "next")).toBe(
      "M 448 32 C 448 -24, 118 -24, 118 32",
    )
  })

  it("routes forward prev links under the nodes", () => {
    expect(buildLinkedListPath(fallbackBoxes[0], fallbackBoxes[2], "prev")).toBe(
      "M 0 56 C 0 112, 330 112, 330 56",
    )
  })
})

describe("buildLinkedListLinks", () => {
  it("resolves every stored pointer into a path", () => {
    const links = buildLinkedListLinks(stateWithIds(), fallbackBoxes)

    expect(links.map((link) => link.id)).toEqual(["a:next", "b:next", "b:prev", "c:prev"])
    expect(links.map((link) => link.d)).toEqual([
      "M 112 32 C 137 32, 137 32, 162 32",
      "M 280 32 C 305 32, 305 32, 330 32",
      "M 168 56 C 143 56, 143 56, 118 56",
      "M 336 56 C 311 56, 311 56, 286 56",
    ])
  })

  it("re-measures into new paths after a layout shift", () => {
    const shifted = fallbackBoxes.map((box) => ({ ...box, x: box.x + 40 }))
    const before = buildLinkedListLinks(stateWithIds(), fallbackBoxes)
    const after = buildLinkedListLinks(stateWithIds(), shifted)

    expect(after[0].d).not.toBe(before[0].d)
    expect(after[0].d).toBe("M 152 32 C 177 32, 177 32, 202 32")
  })

  it("skips links whose target is missing from the layout", () => {
    const links = buildLinkedListLinks(stateWithIds(), fallbackBoxes.slice(0, 1))

    expect(links).toEqual([])
  })
})

describe("LinkedListCanvas", () => {
  it("renders the node count, status, and link count", () => {
    renderCanvas()

    expect(screen.getByTestId("linked-list-size")).toHaveTextContent("3")
    expect(screen.getByTestId("linked-list-status")).toHaveTextContent("linked")
    expect(screen.getByTestId("linked-list-link-count")).toHaveTextContent("4 links")
    expect(screen.getByTestId("linked-list-hint")).toHaveTextContent(
      "Next pointers run above the nodes; prev pointers run below.",
    )
  })

  it("renders one card per node and one path per pointer", () => {
    const state = createLinkedListState({ initialValues: [12, 7, 24] })
    renderCanvas(state)

    for (const node of state.nodes) {
      expect(screen.getByTestId(`linked-list-card-${node.id}`)).toHaveTextContent(
        String(node.value),
      )
    }

    expect(screen.getAllByTestId(/^linked-list-edge-/)).toHaveLength(4)

    for (const node of state.nodes) {
      if (node.nextId) {
        const edge = screen.getByTestId(`linked-list-edge-${linkedListEdgeId(node.id, "next")}`)

        expect(edge).toHaveAttribute("data-direction", "next")
        expect(edge.getAttribute("d")).toMatch(/^M /)
      }

      if (node.prevId) {
        const edge = screen.getByTestId(`linked-list-edge-${linkedListEdgeId(node.id, "prev")}`)

        expect(edge).toHaveAttribute("data-direction", "prev")
        expect(edge.getAttribute("d")).toMatch(/^M /)
      }
    }
  })

  it("renders the address on every node card", () => {
    const state = createLinkedListState({ initialValues: [12, 7, 24] })
    renderCanvas(state)

    for (const node of state.nodes) {
      expect(screen.getByTestId(`linked-list-address-${node.id}`)).toHaveTextContent(node.address)
    }
  })

  it("renders an empty state without paths", () => {
    renderCanvas(createLinkedListState())

    expect(screen.getByTestId("linked-list-size")).toHaveTextContent("0")
    expect(screen.getByTestId("linked-list-status")).toHaveTextContent("empty")
    expect(screen.getByTestId("linked-list-link-count")).toHaveTextContent("0 links")
    expect(screen.getByText("No nodes yet")).toBeInTheDocument()
    expect(screen.getByTestId("linked-list-hint")).toHaveTextContent(
      "Empty list — nodes will appear here with prev and next pointers.",
    )
    expect(screen.queryAllByTestId(/^linked-list-edge-/)).toHaveLength(0)
  })

  it("applies node and edge highlight roles", () => {
    const state = createLinkedListState({ initialValues: [12, 7, 24] })
    const nextEdge = linkedListEdgeId(state.nodes[0].id, "next")

    renderCanvas(state, [
      { target: "node", id: state.nodes[1].id, role: "active" },
      { target: "edge", id: nextEdge, role: "remove" },
    ])

    const activeNode = screen.getByTestId(`linked-list-card-${state.nodes[1].id}`)

    expect(activeNode).toHaveAttribute("data-highlight", "active")
    expect(activeNode).toHaveTextContent("now")
    expect(screen.getByTestId(`linked-list-edge-${nextEdge}`)).toHaveAttribute(
      "data-highlight",
      "remove",
    )
  })

  it("lets the strongest edge highlight win", () => {
    const state = createLinkedListState({ initialValues: [12, 7, 24] })
    const nextEdge = linkedListEdgeId(state.nodes[0].id, "next")

    renderCanvas(state, [
      { target: "edge", id: nextEdge, role: "source" },
      { target: "edge", id: nextEdge, role: "remove" },
    ])

    expect(screen.getByTestId(`linked-list-edge-${nextEdge}`)).toHaveAttribute(
      "data-highlight",
      "remove",
    )
  })

  it("describes the list for assistive technology", () => {
    const { rerender } = renderCanvas()

    expect(
      screen.getByRole("img", {
        name: /Doubly linked list with 3 nodes; head is 12 at 0x1000, tail is 24 at 0x1020/,
      }),
    ).toBeInTheDocument()

    rerender(<LinkedListCanvas state={createLinkedListState()} />)

    expect(screen.getByRole("img", { name: "Empty doubly linked list." })).toBeInTheDocument()
  })

  it("selects a pointer from its dot", () => {
    const state = createLinkedListState({ initialValues: [12, 7, 24] })
    const onPointerSelect = vi.fn()

    render(<LinkedListCanvas state={state} onPointerSelect={onPointerSelect} />)

    fireEvent.click(screen.getByRole("button", { name: "next pointer of 12 to 7" }))
    fireEvent.click(screen.getByRole("button", { name: "prev pointer of 7 to 12" }))
    fireEvent.click(screen.getByRole("button", { name: "next pointer of 24 is null" }))

    expect(onPointerSelect).toHaveBeenNthCalledWith(1, {
      nodeId: state.nodes[0].id,
      direction: "next",
    })
    expect(onPointerSelect).toHaveBeenNthCalledWith(2, {
      nodeId: state.nodes[1].id,
      direction: "prev",
    })
    expect(onPointerSelect).toHaveBeenNthCalledWith(3, {
      nodeId: state.nodes[2].id,
      direction: "next",
    })
  })

  it("marks the selected pointer and its source node", () => {
    const state = createLinkedListState({ initialValues: [12, 7, 24] })

    render(
      <LinkedListCanvas
        state={state}
        selectedPointer={{ nodeId: state.nodes[0].id, direction: "next" }}
        onPointerSelect={vi.fn()}
      />,
    )

    const selected = screen.getByRole("button", { name: "next pointer of 12 to 7" })

    expect(selected).toHaveAttribute("aria-pressed", "true")
    expect(selected).toHaveAttribute("data-selected", "true")
    expect(screen.getByRole("button", { name: "prev pointer of 12 is null" })).toHaveAttribute(
      "aria-pressed",
      "false",
    )
    expect(screen.getByTestId(`linked-list-card-${state.nodes[0].id}`)).toHaveClass("ring-1")
    expect(screen.getByTestId("linked-list-hint")).toHaveTextContent("Selected 12.next → 7")
  })

  it("offers relink targets and disables the source and current target", () => {
    const state = createLinkedListState({ initialValues: [12, 7, 24] })
    const onRelinkTarget = vi.fn()

    render(
      <LinkedListCanvas
        state={state}
        selectedPointer={{ nodeId: state.nodes[0].id, direction: "next" }}
        onPointerSelect={vi.fn()}
        onRelinkTarget={onRelinkTarget}
      />,
    )

    const source = screen.getByTestId(`linked-list-relink-${state.nodes[0].id}`)
    const current = screen.getByTestId(`linked-list-relink-${state.nodes[1].id}`)
    const other = screen.getByTestId(`linked-list-relink-${state.nodes[2].id}`)

    expect(source).toBeDisabled()
    expect(current).toBeDisabled()
    expect(current).toHaveTextContent("linked")
    expect(other).not.toBeDisabled()
    expect(other).toHaveTextContent("relink")

    fireEvent.click(other)

    expect(onRelinkTarget).toHaveBeenCalledWith(state.nodes[2].id)
  })

  it("warns about broken links and shows the broken status", () => {
    const state = createLinkedListState({ initialValues: [12, 7, 24] })
    const broken: LinkedListState = {
      ...state,
      nodes: state.nodes.map((node, index) => (index === 1 ? { ...node, nextId: null } : node)),
    }
    const onRepair = vi.fn()

    render(<LinkedListCanvas state={broken} onRepair={onRepair} />)

    expect(screen.getByTestId("linked-list-status")).toHaveTextContent("broken")

    const warning = screen.getByTestId("linked-list-integrity-warning")

    expect(warning).toHaveAttribute("data-integrity", "broken")
    expect(warning).toHaveTextContent("Broken links")
    expect(warning).toHaveTextContent(/next should be "linked-list-node-3" but is null/)

    fireEvent.click(screen.getByRole("button", { name: "Repair links" }))

    expect(onRepair).toHaveBeenCalledTimes(1)
  })

  it("reports cycles in the status and warning", () => {
    const state = createLinkedListState({ initialValues: [12, 7] })
    const cyclic: LinkedListState = {
      ...state,
      nodes: state.nodes.map((node, index) =>
        index === 0
          ? { ...node, prevId: state.nodes[1].id }
          : { ...node, nextId: state.nodes[0].id },
      ),
    }

    render(<LinkedListCanvas state={cyclic} />)

    expect(screen.getByTestId("linked-list-status")).toHaveTextContent("cycle")
    expect(screen.getByTestId("linked-list-integrity-warning")).toHaveTextContent("Cycle detected")
  })

  it("does not warn when the list is intact", () => {
    renderCanvas()

    expect(screen.queryByTestId("linked-list-integrity-warning")).not.toBeInTheDocument()
    expect(screen.getByTestId("linked-list-status")).toHaveTextContent("linked")
  })

  it("keeps pointer dots decorative without a selection handler", () => {
    renderCanvas()

    expect(screen.queryByRole("button", { name: /pointer of/ })).not.toBeInTheDocument()
  })
})
