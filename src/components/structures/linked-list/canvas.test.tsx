import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
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
})
