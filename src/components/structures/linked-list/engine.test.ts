import { describe, expect, it } from "vitest"
import {
  appendLinkedList,
  checkLinkedListIntegrity,
  createLinkedListState,
  findLinkedListNode,
  formatLinkedListAddress,
  insertLinkedListAfter,
  insertLinkedListBefore,
  isLinkedListEmpty,
  linkedListEdgeId,
  linkedListHeadNode,
  linkedListNodeId,
  linkedListNodeIndex,
  linkedListLinks,
  linkedListSize,
  linkedListTailNode,
  prependLinkedList,
  removeLinkedListNode,
  traverseLinkedList,
  type LinkedListFrame,
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

function finalState(frames: readonly LinkedListFrame[]): LinkedListState {
  return frames[frames.length - 1].state
}

function nodeSummary(
  state: LinkedListState,
): Array<[string, number, string | null, string | null]> {
  return state.nodes.map((node) => [node.id, node.value, node.prevId, node.nextId])
}

describe("prependLinkedList", () => {
  it("prepends a node and relinks the old head", () => {
    const state = createLinkedListState({ initialValues: [12, 7] })
    const frames = prependLinkedList(state, 5)
    const next = finalState(frames)

    expect(frames).toHaveLength(2)
    expect(frames.map((frame) => frame.id)).toEqual(["linked-list-frame-0", "linked-list-frame-1"])
    expect(frames.map((frame) => frame.phase)).toEqual(["link", "complete"])
    expect(frames[1].feedback).toBe("success")
    expect(nodeSummary(next)).toEqual([
      ["linked-list-node-3", 5, null, "linked-list-node-1"],
      ["linked-list-node-1", 12, "linked-list-node-3", "linked-list-node-2"],
      ["linked-list-node-2", 7, "linked-list-node-1", null],
    ])
    expect(next.headId).toBe("linked-list-node-3")
    expect(next.tailId).toBe("linked-list-node-2")
    expect(next.nodes[0].address).toBe("0x1020")
    expect(next.nextNodeId).toBe(4)
    expect(next.nextAddress).toBe(0x1030)
    expect(next.nextFrameId).toBe(2)
    expect(checkLinkedListIntegrity(next).status).toBe("ok")
  })

  it("highlights the new node and both rewired pointers", () => {
    const state = createLinkedListState({ initialValues: [12, 7] })
    const frames = prependLinkedList(state, 5)

    expect(frames[0].highlights).toContainEqual({
      target: "node",
      id: "linked-list-node-3",
      role: "insert",
    })
    expect(frames[0].highlights).toContainEqual({
      target: "edge",
      id: "linked-list-node-3:next",
      role: "insert",
    })
    expect(frames[0].highlights).toContainEqual({
      target: "edge",
      id: "linked-list-node-1:prev",
      role: "insert",
    })
    expect(frames[1].highlights).toContainEqual({
      target: "node",
      id: "linked-list-node-3",
      role: "active",
    })
  })

  it("prepends into an empty list", () => {
    const next = finalState(prependLinkedList(createLinkedListState(), 5))

    expect(nodeSummary(next)).toEqual([["linked-list-node-1", 5, null, null]])
    expect(next.headId).toBe("linked-list-node-1")
    expect(next.tailId).toBe("linked-list-node-1")
    expect(next.nextAddress).toBe(0x1010)
    expect(checkLinkedListIntegrity(next).status).toBe("ok")
  })
})

describe("appendLinkedList", () => {
  it("appends a node and relinks the old tail", () => {
    const state = createLinkedListState({ initialValues: [12, 7] })
    const frames = appendLinkedList(state, 24)
    const next = finalState(frames)

    expect(frames.map((frame) => frame.phase)).toEqual(["link", "complete"])
    expect(nodeSummary(next)).toEqual([
      ["linked-list-node-1", 12, null, "linked-list-node-2"],
      ["linked-list-node-2", 7, "linked-list-node-1", "linked-list-node-3"],
      ["linked-list-node-3", 24, "linked-list-node-2", null],
    ])
    expect(next.headId).toBe("linked-list-node-1")
    expect(next.tailId).toBe("linked-list-node-3")
    expect(next.nodes[2].address).toBe("0x1020")
    expect(checkLinkedListIntegrity(next).status).toBe("ok")
  })

  it("highlights the new node and both rewired pointers", () => {
    const frames = appendLinkedList(createLinkedListState({ initialValues: [12, 7] }), 24)

    expect(frames[0].highlights).toContainEqual({
      target: "edge",
      id: "linked-list-node-2:next",
      role: "insert",
    })
    expect(frames[0].highlights).toContainEqual({
      target: "edge",
      id: "linked-list-node-3:prev",
      role: "insert",
    })
  })

  it("appends into an empty list", () => {
    const next = finalState(appendLinkedList(createLinkedListState(), 24))

    expect(nodeSummary(next)).toEqual([["linked-list-node-1", 24, null, null]])
    expect(next.headId).toBe("linked-list-node-1")
    expect(next.tailId).toBe("linked-list-node-1")
    expect(checkLinkedListIntegrity(next).status).toBe("ok")
  })
})

describe("insertLinkedListAfter", () => {
  it("inserts after a middle node and rewires both neighbors", () => {
    const state = createLinkedListState({ initialValues: [1, 2, 3] })
    const frames = insertLinkedListAfter(state, "linked-list-node-2", 9)
    const next = finalState(frames)

    expect(frames.map((frame) => frame.phase)).toEqual(["locate", "link", "complete"])
    expect(nodeSummary(next)).toEqual([
      ["linked-list-node-1", 1, null, "linked-list-node-2"],
      ["linked-list-node-2", 2, "linked-list-node-1", "linked-list-node-4"],
      ["linked-list-node-4", 9, "linked-list-node-2", "linked-list-node-3"],
      ["linked-list-node-3", 3, "linked-list-node-4", null],
    ])
    expect(next.tailId).toBe("linked-list-node-3")
    expect(next.nodes[2].address).toBe("0x1030")
    expect(checkLinkedListIntegrity(next).status).toBe("ok")
  })

  it("inserts after the tail and moves the tail", () => {
    const frames = insertLinkedListAfter(
      createLinkedListState({ initialValues: [1, 2, 3] }),
      "linked-list-node-3",
      9,
    )
    const next = finalState(frames)

    expect(next.nodes.map((node) => node.value)).toEqual([1, 2, 3, 9])
    expect(next.tailId).toBe("linked-list-node-4")
    expect(next.nodes[3].nextId).toBeNull()
    expect(frames[1].detail).toContain("move the tail")
    expect(checkLinkedListIntegrity(next).status).toBe("ok")
  })

  it("highlights the located target and the four rewired pointers", () => {
    const frames = insertLinkedListAfter(
      createLinkedListState({ initialValues: [1, 2, 3] }),
      "linked-list-node-2",
      9,
    )

    expect(frames[0].highlights).toContainEqual({
      target: "node",
      id: "linked-list-node-2",
      role: "source",
    })

    for (const id of [
      "linked-list-node-4:prev",
      "linked-list-node-4:next",
      "linked-list-node-2:next",
      "linked-list-node-3:prev",
    ]) {
      expect(frames[1].highlights).toContainEqual({
        target: "edge",
        id,
        role: "insert",
      })
    }
  })

  it("reports a missing target without changing the list", () => {
    const state = createLinkedListState({ initialValues: [1, 2] })
    const frames = insertLinkedListAfter(state, "linked-list-node-404", 9)

    expect(frames).toHaveLength(1)
    expect(frames[0]).toMatchObject({ phase: "missing", feedback: "error" })
    expect(frames[0].detail).toContain("not in the list")
    expect(frames[0].state.nodes).toBe(state.nodes)
  })
})

describe("insertLinkedListBefore", () => {
  it("inserts before a middle node and rewires both neighbors", () => {
    const state = createLinkedListState({ initialValues: [1, 2, 3] })
    const frames = insertLinkedListBefore(state, "linked-list-node-2", 9)
    const next = finalState(frames)

    expect(frames.map((frame) => frame.phase)).toEqual(["locate", "link", "complete"])
    expect(nodeSummary(next)).toEqual([
      ["linked-list-node-1", 1, null, "linked-list-node-4"],
      ["linked-list-node-4", 9, "linked-list-node-1", "linked-list-node-2"],
      ["linked-list-node-2", 2, "linked-list-node-4", "linked-list-node-3"],
      ["linked-list-node-3", 3, "linked-list-node-2", null],
    ])
    expect(next.headId).toBe("linked-list-node-1")
    expect(checkLinkedListIntegrity(next).status).toBe("ok")
  })

  it("inserts before the head and moves the head", () => {
    const frames = insertLinkedListBefore(
      createLinkedListState({ initialValues: [1, 2, 3] }),
      "linked-list-node-1",
      9,
    )
    const next = finalState(frames)

    expect(next.nodes.map((node) => node.value)).toEqual([9, 1, 2, 3])
    expect(next.headId).toBe("linked-list-node-4")
    expect(next.nodes[0].prevId).toBeNull()
    expect(frames[1].detail).toContain("move the head")
    expect(checkLinkedListIntegrity(next).status).toBe("ok")
  })

  it("highlights the located target and the four rewired pointers", () => {
    const frames = insertLinkedListBefore(
      createLinkedListState({ initialValues: [1, 2, 3] }),
      "linked-list-node-2",
      9,
    )

    expect(frames[0].highlights).toContainEqual({
      target: "node",
      id: "linked-list-node-2",
      role: "source",
    })

    for (const id of [
      "linked-list-node-4:prev",
      "linked-list-node-4:next",
      "linked-list-node-2:prev",
      "linked-list-node-1:next",
    ]) {
      expect(frames[1].highlights).toContainEqual({
        target: "edge",
        id,
        role: "insert",
      })
    }
  })

  it("reports a missing target without changing the list", () => {
    const state = createLinkedListState({ initialValues: [1, 2] })
    const frames = insertLinkedListBefore(state, "linked-list-node-404", 9)

    expect(frames).toHaveLength(1)
    expect(frames[0]).toMatchObject({ phase: "missing", feedback: "error" })
    expect(frames[0].state.nodes).toBe(state.nodes)
  })
})

describe("removeLinkedListNode", () => {
  it("removes a middle node and connects its neighbors", () => {
    const state = createLinkedListState({ initialValues: [1, 2, 3] })
    const frames = removeLinkedListNode(state, "linked-list-node-2")
    const next = finalState(frames)

    expect(frames.map((frame) => frame.phase)).toEqual(["locate", "unlink", "complete"])
    expect(nodeSummary(next)).toEqual([
      ["linked-list-node-1", 1, null, "linked-list-node-3"],
      ["linked-list-node-3", 3, "linked-list-node-1", null],
    ])
    expect(next.headId).toBe("linked-list-node-1")
    expect(next.tailId).toBe("linked-list-node-3")
    expect(frames[1].detail).toBe("Connect 1 directly to 3.")
    expect(checkLinkedListIntegrity(next).status).toBe("ok")
  })

  it("removes the head and moves the head pointer", () => {
    const frames = removeLinkedListNode(
      createLinkedListState({ initialValues: [1, 2, 3] }),
      "linked-list-node-1",
    )
    const next = finalState(frames)

    expect(next.nodes.map((node) => node.value)).toEqual([2, 3])
    expect(next.headId).toBe("linked-list-node-2")
    expect(next.nodes[0].prevId).toBeNull()
    expect(frames[1].detail).toBe("Move the head to 2.")
    expect(checkLinkedListIntegrity(next).status).toBe("ok")
  })

  it("removes the tail and moves the tail pointer", () => {
    const frames = removeLinkedListNode(
      createLinkedListState({ initialValues: [1, 2, 3] }),
      "linked-list-node-3",
    )
    const next = finalState(frames)

    expect(next.nodes.map((node) => node.value)).toEqual([1, 2])
    expect(next.tailId).toBe("linked-list-node-2")
    expect(next.nodes[1].nextId).toBeNull()
    expect(frames[1].detail).toBe("Move the tail to 2.")
    expect(checkLinkedListIntegrity(next).status).toBe("ok")
  })

  it("removes the only node and clears head and tail", () => {
    const frames = removeLinkedListNode(
      createLinkedListState({ initialValues: [1] }),
      "linked-list-node-1",
    )
    const next = finalState(frames)

    expect(next.nodes).toEqual([])
    expect(next.headId).toBeNull()
    expect(next.tailId).toBeNull()
    expect(frames[1].detail).toBe("Release the only node; the list becomes empty.")
    expect(frames[2].detail).toBe("Removed 1; the list is empty.")
    expect(checkLinkedListIntegrity(next).status).toBe("ok")
  })

  it("highlights the removed node and the relinked pointers", () => {
    const frames = removeLinkedListNode(
      createLinkedListState({ initialValues: [1, 2, 3] }),
      "linked-list-node-2",
    )

    expect(frames[0].highlights).toContainEqual({
      target: "node",
      id: "linked-list-node-2",
      role: "remove",
    })
    expect(frames[1].highlights).toContainEqual({
      target: "edge",
      id: "linked-list-node-1:next",
      role: "insert",
    })
    expect(frames[1].highlights).toContainEqual({
      target: "edge",
      id: "linked-list-node-3:prev",
      role: "insert",
    })
  })

  it("reports a missing target without changing the list", () => {
    const state = createLinkedListState({ initialValues: [1, 2] })
    const frames = removeLinkedListNode(state, "linked-list-node-404")

    expect(frames).toHaveLength(1)
    expect(frames[0]).toMatchObject({ phase: "missing", feedback: "error" })
    expect(frames[0].state.nodes).toBe(state.nodes)
  })
})

describe("traverseLinkedList", () => {
  it("visits every node from head to tail", () => {
    const state = createLinkedListState({ initialValues: [12, 7, 24] })
    const frames = traverseLinkedList(state)

    expect(frames.map((frame) => frame.phase)).toEqual(["start", "visit", "visit", "complete"])
    expect(frames.map((frame) => frame.detail)).toEqual([
      "Visit 12; node 1 of 3.",
      "Visit 7; node 2 of 3.",
      "Visit 24; node 3 of 3.",
      "Traversal visited all 3 nodes and reached the tail.",
    ])
    expect(frames[3].feedback).toBe("success")
    expect(frames.map((frame) => frame.id)).toEqual([
      "linked-list-frame-0",
      "linked-list-frame-1",
      "linked-list-frame-2",
      "linked-list-frame-3",
    ])
    expect(finalState(frames).nextFrameId).toBe(4)
  })

  it("highlights the active node and the outgoing next pointer", () => {
    const frames = traverseLinkedList(createLinkedListState({ initialValues: [12, 7] }))

    expect(frames[0].highlights).toContainEqual({
      target: "node",
      id: "linked-list-node-1",
      role: "active",
    })
    expect(frames[0].highlights).toContainEqual({
      target: "edge",
      id: "linked-list-node-1:next",
      role: "pointer",
    })
    expect(frames[1].highlights).toContainEqual({
      target: "node",
      id: "linked-list-node-2",
      role: "active",
    })
    expect(frames[1].highlights).not.toContainEqual(expect.objectContaining({ target: "edge" }))
  })

  it("warns when the list is empty", () => {
    const frames = traverseLinkedList(createLinkedListState())

    expect(frames).toHaveLength(1)
    expect(frames[0]).toMatchObject({ phase: "empty", feedback: "warning" })
    expect(frames[0].detail).toBe("Cannot traverse an empty list.")
  })
})

describe("sequential linked list operations", () => {
  it("continues frame ids across operations", () => {
    const appended = appendLinkedList(createLinkedListState({ initialValues: [1] }), 2)
    const afterAppend = finalState(appended)
    const prepended = prependLinkedList(afterAppend, 3)

    expect(prepended.map((frame) => frame.id)).toEqual([
      "linked-list-frame-2",
      "linked-list-frame-3",
    ])
    expect(finalState(prepended).nextFrameId).toBe(4)
  })

  it("never reuses node ids or addresses after a removal", () => {
    const removed = removeLinkedListNode(
      createLinkedListState({ initialValues: [1, 2, 3] }),
      "linked-list-node-2",
    )
    const afterRemove = finalState(removed)
    const appended = appendLinkedList(afterRemove, 4)
    const next = finalState(appended)

    expect(next.nodes.map((node) => node.id)).toEqual([
      "linked-list-node-1",
      "linked-list-node-3",
      "linked-list-node-4",
    ])
    expect(next.nodes[2].address).toBe("0x1030")
    expect(next.nextNodeId).toBe(5)
    expect(next.nextAddress).toBe(0x1040)
  })

  it("keeps integrity intact through a mixed sequence", () => {
    let state = createLinkedListState({ initialValues: [1, 2, 3] })

    state = finalState(prependLinkedList(state, 0))
    state = finalState(appendLinkedList(state, 4))
    state = finalState(insertLinkedListAfter(state, "linked-list-node-3", 9))
    state = finalState(insertLinkedListBefore(state, "linked-list-node-1", 7))
    state = finalState(removeLinkedListNode(state, "linked-list-node-2"))

    expect(state.nodes.map((node) => node.value)).toEqual([0, 7, 1, 3, 9, 4])
    expect(checkLinkedListIntegrity(state).status).toBe("ok")
  })
})
