import { describe, expect, it } from "vitest"
import {
  checkLinkedListIntegrity,
  createLinkedListState,
  findLinkedListNode,
  formatLinkedListAddress,
  isLinkedListEmpty,
  linkedListEdgeId,
  linkedListHeadNode,
  linkedListNodeId,
  linkedListNodeIndex,
  linkedListLinks,
  linkedListSize,
  linkedListTailNode,
  type LinkedListNode,
  type LinkedListState,
} from "@/components/structures/linked-list/engine"

function patchNode(
  state: LinkedListState,
  id: string,
  patch: Partial<LinkedListNode>,
): LinkedListState {
  return {
    ...state,
    nodes: state.nodes.map((node) => (node.id === id ? { ...node, ...patch } : node)),
  }
}

function integrityCodes(state: LinkedListState): string[] {
  return checkLinkedListIntegrity(state).issues.map((issue) => issue.code)
}

describe("createLinkedListState", () => {
  it("creates an empty list with null head and tail", () => {
    const state = createLinkedListState()

    expect(state.nodes).toEqual([])
    expect(state.headId).toBeNull()
    expect(state.tailId).toBeNull()
    expect(state.nextNodeId).toBe(1)
    expect(state.nextAddress).toBe(0x1000)
    expect(state.nextFrameId).toBe(0)
    expect(isLinkedListEmpty(state)).toBe(true)
    expect(linkedListSize(state)).toBe(0)
    expect(linkedListHeadNode(state)).toBeNull()
    expect(linkedListTailNode(state)).toBeNull()
    expect(checkLinkedListIntegrity(state)).toEqual({ status: "ok", issues: [] })
  })

  it("seeds nodes with stable ids, values, addresses, and bidirectional links", () => {
    const state = createLinkedListState({ initialValues: [12, 7, 24] })

    expect(state.nodes.map((node) => node.id)).toEqual([
      "linked-list-node-1",
      "linked-list-node-2",
      "linked-list-node-3",
    ])
    expect(state.nodes.map((node) => node.value)).toEqual([12, 7, 24])
    expect(state.nodes.map((node) => node.address)).toEqual(["0x1000", "0x1010", "0x1020"])
    expect(state.nodes.map((node) => [node.prevId, node.nextId])).toEqual([
      [null, "linked-list-node-2"],
      ["linked-list-node-1", "linked-list-node-3"],
      ["linked-list-node-2", null],
    ])
    expect(state.headId).toBe("linked-list-node-1")
    expect(state.tailId).toBe("linked-list-node-3")
    expect(state.nextNodeId).toBe(4)
    expect(state.nextAddress).toBe(0x1030)
  })

  it("formats pseudo-memory addresses and stable node ids", () => {
    expect(linkedListNodeId(7)).toBe("linked-list-node-7")
    expect(formatLinkedListAddress(0x1000)).toBe("0x1000")
    expect(formatLinkedListAddress(0x10a0)).toBe("0x10A0")
    expect(formatLinkedListAddress(0)).toBe("0x0000")
    expect(formatLinkedListAddress(-4)).toBe("0x0000")
    expect(formatLinkedListAddress(Number.NaN)).toBe("0x0000")
  })

  it("exposes head, tail, lookup, and index helpers", () => {
    const state = createLinkedListState({ initialValues: [12, 7, 24] })

    expect(linkedListSize(state)).toBe(3)
    expect(isLinkedListEmpty(state)).toBe(false)
    expect(linkedListHeadNode(state)).toEqual(state.nodes[0])
    expect(linkedListTailNode(state)).toEqual(state.nodes[2])
    expect(findLinkedListNode(state, "linked-list-node-2")).toEqual(state.nodes[1])
    expect(findLinkedListNode(state, null)).toBeNull()
    expect(findLinkedListNode(state, "missing")).toBeNull()
    expect(linkedListNodeIndex(state, "linked-list-node-2")).toBe(1)
    expect(linkedListNodeIndex(state, "missing")).toBe(-1)
    expect(linkedListNodeIndex(state, null)).toBe(-1)
  })
})

describe("checkLinkedListIntegrity", () => {
  it("accepts a healthy list in both directions", () => {
    const state = createLinkedListState({ initialValues: [1, 2, 3, 4] })

    expect(checkLinkedListIntegrity(state)).toEqual({ status: "ok", issues: [] })
  })

  it("detects a broken prev pointer", () => {
    const state = patchNode(
      createLinkedListState({ initialValues: [1, 2, 3] }),
      "linked-list-node-2",
      {
        prevId: null,
      },
    )
    const integrity = checkLinkedListIntegrity(state)

    expect(integrity.status).toBe("broken")
    expect(integrity.issues).toContainEqual(
      expect.objectContaining({ code: "prev-mismatch", nodeId: "linked-list-node-2" }),
    )
  })

  it("detects a broken next pointer", () => {
    const state = patchNode(
      createLinkedListState({ initialValues: [1, 2, 3] }),
      "linked-list-node-2",
      {
        nextId: null,
      },
    )
    const integrity = checkLinkedListIntegrity(state)

    expect(integrity.status).toBe("broken")
    expect(integrity.issues).toContainEqual(
      expect.objectContaining({ code: "next-mismatch", nodeId: "linked-list-node-2" }),
    )
  })

  it("detects a pointer to a missing node", () => {
    const state = patchNode(
      createLinkedListState({ initialValues: [1, 2, 3] }),
      "linked-list-node-1",
      {
        nextId: "linked-list-node-404",
      },
    )
    const integrity = checkLinkedListIntegrity(state)

    expect(integrity.status).toBe("broken")
    expect(integrity.issues).toContainEqual(
      expect.objectContaining({ code: "missing-link", nodeId: "linked-list-node-1" }),
    )
    expect(integrity.issues[0].detail).toContain("missing node")
  })

  it("detects a head mismatch", () => {
    const state = {
      ...createLinkedListState({ initialValues: [1, 2, 3] }),
      headId: "linked-list-node-2",
    }
    const integrity = checkLinkedListIntegrity(state)

    expect(integrity.status).toBe("broken")
    expect(integrityCodes(state)).toEqual(["head-mismatch"])
  })

  it("detects a tail mismatch", () => {
    const state = {
      ...createLinkedListState({ initialValues: [1, 2, 3] }),
      tailId: "linked-list-node-2",
    }
    const integrity = checkLinkedListIntegrity(state)

    expect(integrity.status).toBe("broken")
    expect(integrityCodes(state)).toEqual(["tail-mismatch"])
  })

  it("rejects an empty list that still points at a head or tail", () => {
    const state = {
      ...createLinkedListState(),
      headId: "linked-list-node-1",
      tailId: "linked-list-node-1",
    }
    const integrity = checkLinkedListIntegrity(state)

    expect(integrity.status).toBe("broken")
    expect(integrityCodes(state)).toEqual(["head-mismatch", "tail-mismatch"])
  })

  it("detects duplicate node ids", () => {
    const state: LinkedListState = {
      nodes: [
        {
          id: "linked-list-node-1",
          value: 1,
          address: "0x1000",
          prevId: null,
          nextId: "linked-list-node-1",
        },
        {
          id: "linked-list-node-1",
          value: 2,
          address: "0x1010",
          prevId: "linked-list-node-1",
          nextId: null,
        },
      ],
      headId: "linked-list-node-1",
      tailId: "linked-list-node-1",
      nextNodeId: 2,
      nextAddress: 0x1020,
      nextFrameId: 0,
    }
    const integrity = checkLinkedListIntegrity(state)

    expect(integrity.status).toBe("broken")
    expect(integrityCodes(state)).toEqual(["duplicate-id"])
    expect(integrity.issues[0].detail).toContain("2 times")
  })

  it("detects duplicate pseudo-memory addresses", () => {
    const base = createLinkedListState({ initialValues: [1, 2, 3] })
    const state = patchNode(base, "linked-list-node-3", { address: base.nodes[1].address })
    const integrity = checkLinkedListIntegrity(state)

    expect(integrity.status).toBe("broken")
    expect(integrityCodes(state)).toEqual(["duplicate-address"])
  })

  it("detects a next-link cycle", () => {
    const state = patchNode(
      createLinkedListState({ initialValues: [1, 2, 3] }),
      "linked-list-node-3",
      {
        nextId: "linked-list-node-1",
      },
    )
    const integrity = checkLinkedListIntegrity(state)
    const cycle = integrity.issues.find((issue) => issue.code === "cycle")

    expect(integrity.status).toBe("cycle")
    expect(integrity.issues).toContainEqual(
      expect.objectContaining({ code: "next-mismatch", nodeId: "linked-list-node-3" }),
    )
    expect(cycle?.detail).toContain(
      '"linked-list-node-1" → "linked-list-node-2" → "linked-list-node-3" → "linked-list-node-1"',
    )
  })

  it("detects a prev-link cycle", () => {
    const state = patchNode(
      createLinkedListState({ initialValues: [1, 2, 3] }),
      "linked-list-node-1",
      {
        prevId: "linked-list-node-3",
      },
    )
    const integrity = checkLinkedListIntegrity(state)

    expect(integrity.status).toBe("cycle")
    expect(integrity.issues).toContainEqual(expect.objectContaining({ code: "cycle" }))
  })

  it("detects a cycle in a disconnected tail", () => {
    const state = patchNode(
      createLinkedListState({ initialValues: [1, 2, 3, 4] }),
      "linked-list-node-4",
      { nextId: "linked-list-node-4" },
    )
    const integrity = checkLinkedListIntegrity(state)

    expect(integrity.status).toBe("cycle")
    expect(integrity.issues).toContainEqual(
      expect.objectContaining({ code: "cycle", nodeId: "linked-list-node-4" }),
    )
  })
})

describe("linkedListLinks", () => {
  it("builds stable edge ids for both pointer directions", () => {
    expect(linkedListEdgeId("linked-list-node-2", "next")).toBe("linked-list-node-2:next")
    expect(linkedListEdgeId("linked-list-node-2", "prev")).toBe("linked-list-node-2:prev")
  })

  it("enumerates next and prev pointers in visual order", () => {
    const state = createLinkedListState({ initialValues: [12, 7, 24] })

    expect(linkedListLinks(state)).toEqual([
      {
        id: "linked-list-node-1:next",
        nodeId: "linked-list-node-1",
        targetId: "linked-list-node-2",
        direction: "next",
      },
      {
        id: "linked-list-node-2:next",
        nodeId: "linked-list-node-2",
        targetId: "linked-list-node-3",
        direction: "next",
      },
      {
        id: "linked-list-node-2:prev",
        nodeId: "linked-list-node-2",
        targetId: "linked-list-node-1",
        direction: "prev",
      },
      {
        id: "linked-list-node-3:prev",
        nodeId: "linked-list-node-3",
        targetId: "linked-list-node-2",
        direction: "prev",
      },
    ])
  })

  it("returns no links for an empty list", () => {
    expect(linkedListLinks(createLinkedListState())).toEqual([])
  })

  it("keeps pointers to missing nodes so broken links can render", () => {
    const state = patchNode(
      createLinkedListState({ initialValues: [1, 2] }),
      "linked-list-node-1",
      { nextId: "linked-list-node-404" },
    )

    expect(linkedListLinks(state)).toContainEqual(
      expect.objectContaining({
        nodeId: "linked-list-node-1",
        targetId: "linked-list-node-404",
        direction: "next",
      }),
    )
  })
})
