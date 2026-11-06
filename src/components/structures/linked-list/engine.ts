import { constantTime, linearTime } from "@/lib/structures/complexity"
import type {
  Complexity,
  Feedback,
  Highlight,
  HighlightRole,
  TraceFrame,
} from "@/lib/structures/types"

export interface LinkedListNode {
  id: string
  value: number
  address: string
  prevId: string | null
  nextId: string | null
}

export type LinkedListDirection = "prev" | "next"

export interface LinkedListPointerRef {
  nodeId: string
  direction: LinkedListDirection
}

export interface LinkedListLinkRef {
  id: string
  nodeId: string
  targetId: string
  direction: LinkedListDirection
}

export type LinkedListIntegrityStatus = "ok" | "broken" | "cycle"

export type LinkedListIntegrityCode =
  | "duplicate-id"
  | "duplicate-address"
  | "head-mismatch"
  | "tail-mismatch"
  | "missing-link"
  | "prev-mismatch"
  | "next-mismatch"
  | "cycle"

export interface LinkedListIntegrityIssue {
  code: LinkedListIntegrityCode
  nodeId: string | null
  detail: string
}

export interface LinkedListIntegrity {
  status: LinkedListIntegrityStatus
  issues: readonly LinkedListIntegrityIssue[]
}

export interface LinkedListState {
  nodes: readonly LinkedListNode[]
  headId: string | null
  tailId: string | null
  nextNodeId: number
  nextAddress: number
  nextFrameId: number
}

export type LinkedListFrame = TraceFrame<LinkedListState>

export interface LinkedListEngineOptions {
  initialValues?: readonly number[]
}

const FIRST_NODE_SEQUENCE = 1
const FIRST_ADDRESS = 0x1000
const ADDRESS_STEP = 0x10

export function linkedListNodeId(sequence: number): string {
  return `linked-list-node-${sequence}`
}

/** Stable highlight id for one node pointer, e.g. `linked-list-node-2:next`. */
export function linkedListEdgeId(nodeId: string, direction: LinkedListDirection): string {
  return `${nodeId}:${direction}`
}

/**
 * Enumerates the pointers stored on each node in visual order. Targets are
 * preserved even when missing so broken links can still be rendered.
 */
export function linkedListLinks(state: LinkedListState): LinkedListLinkRef[] {
  const links: LinkedListLinkRef[] = []

  for (const node of state.nodes) {
    if (node.nextId !== null) {
      links.push({
        id: linkedListEdgeId(node.id, "next"),
        nodeId: node.id,
        targetId: node.nextId,
        direction: "next",
      })
    }

    if (node.prevId !== null) {
      links.push({
        id: linkedListEdgeId(node.id, "prev"),
        nodeId: node.id,
        targetId: node.prevId,
        direction: "prev",
      })
    }
  }

  return links
}

export function formatLinkedListAddress(address: number): string {
  const safeAddress = Number.isFinite(address) ? Math.max(0, Math.trunc(address)) : 0

  return `0x${safeAddress.toString(16).toUpperCase().padStart(4, "0")}`
}

/**
 * Creates a doubly linked list snapshot. Nodes are stored in visual order and
 * receive stable ids plus pseudo-memory addresses that never get reused.
 */
export function createLinkedListState({
  initialValues = [],
}: LinkedListEngineOptions = {}): LinkedListState {
  const nodes: LinkedListNode[] = initialValues.map((value, index) => {
    const sequence = FIRST_NODE_SEQUENCE + index

    return {
      id: linkedListNodeId(sequence),
      value,
      address: formatLinkedListAddress(FIRST_ADDRESS + index * ADDRESS_STEP),
      prevId: index > 0 ? linkedListNodeId(sequence - 1) : null,
      nextId: index < initialValues.length - 1 ? linkedListNodeId(sequence + 1) : null,
    }
  })

  return {
    nodes,
    headId: nodes[0]?.id ?? null,
    tailId: nodes[nodes.length - 1]?.id ?? null,
    nextNodeId: FIRST_NODE_SEQUENCE + nodes.length,
    nextAddress: FIRST_ADDRESS + nodes.length * ADDRESS_STEP,
    nextFrameId: 0,
  }
}

export function isLinkedListEmpty(state: LinkedListState): boolean {
  return state.nodes.length === 0
}

export function linkedListSize(state: LinkedListState): number {
  return state.nodes.length
}

export function linkedListHeadNode(state: LinkedListState): LinkedListNode | null {
  return state.nodes[0] ?? null
}

export function linkedListTailNode(state: LinkedListState): LinkedListNode | null {
  return state.nodes[state.nodes.length - 1] ?? null
}

export function findLinkedListNode(
  state: LinkedListState,
  id: string | null,
): LinkedListNode | null {
  if (id === null) {
    return null
  }

  return state.nodes.find((node) => node.id === id) ?? null
}

/** Returns the visual index for a node id, or `-1` when it is not present. */
export function linkedListNodeIndex(state: LinkedListState, id: string | null): number {
  if (id === null) {
    return -1
  }

  return state.nodes.findIndex((node) => node.id === id)
}

function pointerLabel(id: string | null): string {
  return id === null ? "null" : `"${id}"`
}

/**
 * Walks one pointer direction from every node and reports the first cycle.
 * The traversal is id-based, so callers must skip it when ids are duplicated.
 */
function findCyclePath(
  nodes: readonly LinkedListNode[],
  direction: "prev" | "next",
): string[] | null {
  const byId = new Map<string, LinkedListNode>()

  for (const node of nodes) {
    byId.set(node.id, node)
  }

  const marks = new Map<string, "visiting" | "done">()

  for (const start of nodes) {
    let currentId: string | null = start.id
    const path: string[] = []

    while (currentId !== null) {
      const current = byId.get(currentId)

      if (!current) {
        break
      }

      const mark = marks.get(currentId)

      if (mark === "visiting") {
        const cycleStart = path.indexOf(currentId)

        return cycleStart >= 0 ? path.slice(cycleStart) : [currentId]
      }

      if (mark === "done") {
        break
      }

      marks.set(currentId, "visiting")
      path.push(currentId)
      currentId = direction === "next" ? current.nextId : current.prevId
    }

    for (const id of path) {
      marks.set(id, "done")
    }
  }

  return null
}

/**
 * Validates visual order against `prev`/`next`, head/tail, unique ids and
 * addresses, and cycle-free traversal in both directions. Cycles take
 * precedence over other findings because they make the list unsafe to walk.
 */
export function checkLinkedListIntegrity(state: LinkedListState): LinkedListIntegrity {
  const issues: LinkedListIntegrityIssue[] = []
  const byId = new Map<string, LinkedListNode>()
  const idCounts = new Map<string, number>()
  const addressCounts = new Map<string, number>()

  for (const node of state.nodes) {
    byId.set(node.id, node)
    idCounts.set(node.id, (idCounts.get(node.id) ?? 0) + 1)
    addressCounts.set(node.address, (addressCounts.get(node.address) ?? 0) + 1)
  }

  for (const [id, count] of idCounts) {
    if (count > 1) {
      issues.push({
        code: "duplicate-id",
        nodeId: id,
        detail: `Node id "${id}" appears ${count} times in visual order.`,
      })
    }
  }

  for (const [address, count] of addressCounts) {
    if (count > 1) {
      issues.push({
        code: "duplicate-address",
        nodeId: null,
        detail: `Address ${address} is shared by ${count} nodes.`,
      })
    }
  }

  const expectedHeadId = state.nodes[0]?.id ?? null
  const expectedTailId = state.nodes[state.nodes.length - 1]?.id ?? null

  if (state.headId !== expectedHeadId) {
    issues.push({
      code: "head-mismatch",
      nodeId: state.headId,
      detail: `Head should be ${pointerLabel(expectedHeadId)} but is ${pointerLabel(state.headId)}.`,
    })
  }

  if (state.tailId !== expectedTailId) {
    issues.push({
      code: "tail-mismatch",
      nodeId: state.tailId,
      detail: `Tail should be ${pointerLabel(expectedTailId)} but is ${pointerLabel(state.tailId)}.`,
    })
  }

  state.nodes.forEach((node, index) => {
    const expectedPrevId = state.nodes[index - 1]?.id ?? null

    if (node.prevId !== expectedPrevId) {
      const missing = node.prevId !== null && !byId.has(node.prevId)

      issues.push({
        code: missing ? "missing-link" : "prev-mismatch",
        nodeId: node.id,
        detail: missing
          ? `Node "${node.id}" prev pointer references missing node "${node.prevId}".`
          : `Node "${node.id}" prev should be ${pointerLabel(expectedPrevId)} but is ${pointerLabel(node.prevId)}.`,
      })
    }

    const expectedNextId = state.nodes[index + 1]?.id ?? null

    if (node.nextId !== expectedNextId) {
      const missing = node.nextId !== null && !byId.has(node.nextId)

      issues.push({
        code: missing ? "missing-link" : "next-mismatch",
        nodeId: node.id,
        detail: missing
          ? `Node "${node.id}" next pointer references missing node "${node.nextId}".`
          : `Node "${node.id}" next should be ${pointerLabel(expectedNextId)} but is ${pointerLabel(node.nextId)}.`,
      })
    }
  })

  const hasDuplicateIds = [...idCounts.values()].some((count) => count > 1)

  if (!hasDuplicateIds) {
    for (const direction of ["next", "prev"] as const) {
      const cycle = findCyclePath(state.nodes, direction)

      if (cycle) {
        const loop = [...cycle, cycle[0]].map((id) => `"${id}"`).join(" → ")

        issues.push({
          code: "cycle",
          nodeId: cycle[0] ?? null,
          detail: `Cycle detected via ${direction} links: ${loop}.`,
        })
      }
    }
  }

  return {
    status: issues.some((issue) => issue.code === "cycle")
      ? "cycle"
      : issues.length > 0
        ? "broken"
        : "ok",
    issues,
  }
}

interface LinkedListFrameSpec {
  state: LinkedListState
  operation: string
  phase: string
  detail: string
  complexity: Complexity
  highlights?: readonly Highlight[]
  feedback?: Feedback
}

function buildFrames(
  initialState: LinkedListState,
  specs: readonly LinkedListFrameSpec[],
): LinkedListFrame[] {
  let nextFrameId = initialState.nextFrameId

  return specs.map((spec) => {
    const id = `linked-list-frame-${nextFrameId}`
    const state: LinkedListState = { ...spec.state, nextFrameId: nextFrameId + 1 }
    nextFrameId += 1

    return {
      id,
      state,
      operation: spec.operation,
      phase: spec.phase,
      detail: spec.detail,
      complexity: spec.complexity,
      highlights: [...(spec.highlights ?? [])],
      feedback: spec.feedback ?? "neutral",
    }
  })
}

interface CreatedLinkedListNode {
  node: LinkedListNode
  nextNodeId: number
  nextAddress: number
}

function createLinkedListNode(
  state: LinkedListState,
  value: number,
  prevId: string | null,
  nextId: string | null,
): CreatedLinkedListNode {
  return {
    node: {
      id: linkedListNodeId(state.nextNodeId),
      value,
      address: formatLinkedListAddress(state.nextAddress),
      prevId,
      nextId,
    },
    nextNodeId: state.nextNodeId + 1,
    nextAddress: state.nextAddress + ADDRESS_STEP,
  }
}

function nodeHighlight(nodeId: string, role: HighlightRole): Highlight {
  return { target: "node", id: nodeId, role }
}

function edgeHighlight(
  nodeId: string | null,
  direction: LinkedListDirection,
  role: HighlightRole,
): Highlight[] {
  return nodeId === null ? [] : [{ target: "edge", id: linkedListEdgeId(nodeId, direction), role }]
}

export function prependLinkedList(state: LinkedListState, value: number): LinkedListFrame[] {
  const operation = "prepend"
  const oldHead = linkedListHeadNode(state)
  const { node, nextNodeId, nextAddress } = createLinkedListNode(
    state,
    value,
    null,
    oldHead?.id ?? null,
  )
  const nodes = [
    node,
    ...state.nodes.map((existing) =>
      existing.id === oldHead?.id ? { ...existing, prevId: node.id } : existing,
    ),
  ]
  const nextState: LinkedListState = {
    ...state,
    nodes,
    headId: node.id,
    tailId: state.tailId ?? node.id,
    nextNodeId,
    nextAddress,
  }
  const linkHighlights: Highlight[] = [
    nodeHighlight(node.id, "insert"),
    ...edgeHighlight(oldHead ? node.id : null, "next", "insert"),
    ...edgeHighlight(oldHead?.id ?? null, "prev", "insert"),
  ]
  const complexity = constantTime("Prepending updates the head and at most one prev pointer.")

  return buildFrames(state, [
    {
      state: nextState,
      operation,
      phase: "link",
      detail: oldHead
        ? `Link ${value} before ${oldHead.value} and update the head.`
        : `Link ${value} as the first node.`,
      complexity,
      highlights: linkHighlights,
    },
    {
      state: nextState,
      operation,
      phase: "complete",
      detail: `Prepended ${value}; head is ${value}, size ${nextState.nodes.length}.`,
      complexity,
      highlights: [nodeHighlight(node.id, "active")],
      feedback: "success",
    },
  ])
}

export function appendLinkedList(state: LinkedListState, value: number): LinkedListFrame[] {
  const operation = "append"
  const oldTail = linkedListTailNode(state)
  const { node, nextNodeId, nextAddress } = createLinkedListNode(
    state,
    value,
    oldTail?.id ?? null,
    null,
  )
  const nodes = [
    ...state.nodes.map((existing) =>
      existing.id === oldTail?.id ? { ...existing, nextId: node.id } : existing,
    ),
    node,
  ]
  const nextState: LinkedListState = {
    ...state,
    nodes,
    headId: state.headId ?? node.id,
    tailId: node.id,
    nextNodeId,
    nextAddress,
  }
  const linkHighlights: Highlight[] = [
    nodeHighlight(node.id, "insert"),
    ...edgeHighlight(oldTail?.id ?? null, "next", "insert"),
    ...edgeHighlight(oldTail ? node.id : null, "prev", "insert"),
  ]
  const complexity = constantTime("Appending updates the tail and at most one next pointer.")

  return buildFrames(state, [
    {
      state: nextState,
      operation,
      phase: "link",
      detail: oldTail
        ? `Link ${value} after ${oldTail.value} and move the tail.`
        : `Link ${value} as the first node.`,
      complexity,
      highlights: linkHighlights,
    },
    {
      state: nextState,
      operation,
      phase: "complete",
      detail: `Appended ${value}; tail is ${value}, size ${nextState.nodes.length}.`,
      complexity,
      highlights: [nodeHighlight(node.id, "active")],
      feedback: "success",
    },
  ])
}

export function insertLinkedListAfter(
  state: LinkedListState,
  targetId: string,
  value: number,
): LinkedListFrame[] {
  const operation = "insert-after"
  const target = findLinkedListNode(state, targetId)

  if (!target) {
    return buildFrames(state, [
      {
        state,
        operation,
        phase: "missing",
        detail: `Cannot insert after "${targetId}"; that node is not in the list.`,
        complexity: constantTime("A failed insert stops as soon as the target is missing."),
        feedback: "error",
      },
    ])
  }

  const oldNext = findLinkedListNode(state, target.nextId)
  const { node, nextNodeId, nextAddress } = createLinkedListNode(
    state,
    value,
    target.id,
    target.nextId,
  )
  const relinked = state.nodes.map((existing) => {
    if (existing.id === target.id) {
      return { ...existing, nextId: node.id }
    }

    if (oldNext && existing.id === oldNext.id) {
      return { ...existing, prevId: node.id }
    }

    return existing
  })
  const targetIndex = linkedListNodeIndex(state, target.id)
  const nodes = [...relinked.slice(0, targetIndex + 1), node, ...relinked.slice(targetIndex + 1)]
  const nextState: LinkedListState = {
    ...state,
    nodes,
    tailId: oldNext ? state.tailId : node.id,
    nextNodeId,
    nextAddress,
  }
  const complexity = constantTime("Inserting after a known node rewires at most four pointers.")

  return buildFrames(state, [
    {
      state,
      operation,
      phase: "locate",
      detail: `Found ${target.value}; insert ${value} after it.`,
      complexity,
      highlights: [
        nodeHighlight(target.id, "source"),
        ...edgeHighlight(target.nextId ? target.id : null, "next", "source"),
      ],
    },
    {
      state: nextState,
      operation,
      phase: "link",
      detail: oldNext
        ? `Point ${value} between ${target.value} and ${oldNext.value}, then rewire their pointers.`
        : `Point ${value} after ${target.value} and move the tail.`,
      complexity,
      highlights: [
        nodeHighlight(node.id, "insert"),
        ...edgeHighlight(node.id, "prev", "insert"),
        ...edgeHighlight(oldNext ? node.id : null, "next", "insert"),
        ...edgeHighlight(target.id, "next", "insert"),
        ...edgeHighlight(oldNext?.id ?? null, "prev", "insert"),
      ],
    },
    {
      state: nextState,
      operation,
      phase: "complete",
      detail: `Inserted ${value} after ${target.value}; size ${nodes.length}.`,
      complexity,
      highlights: [nodeHighlight(node.id, "active")],
      feedback: "success",
    },
  ])
}

export function insertLinkedListBefore(
  state: LinkedListState,
  targetId: string,
  value: number,
): LinkedListFrame[] {
  const operation = "insert-before"
  const target = findLinkedListNode(state, targetId)

  if (!target) {
    return buildFrames(state, [
      {
        state,
        operation,
        phase: "missing",
        detail: `Cannot insert before "${targetId}"; that node is not in the list.`,
        complexity: constantTime("A failed insert stops as soon as the target is missing."),
        feedback: "error",
      },
    ])
  }

  const oldPrev = findLinkedListNode(state, target.prevId)
  const { node, nextNodeId, nextAddress } = createLinkedListNode(
    state,
    value,
    target.prevId,
    target.id,
  )
  const relinked = state.nodes.map((existing) => {
    if (existing.id === target.id) {
      return { ...existing, prevId: node.id }
    }

    if (oldPrev && existing.id === oldPrev.id) {
      return { ...existing, nextId: node.id }
    }

    return existing
  })
  const targetIndex = linkedListNodeIndex(state, target.id)
  const nodes = [...relinked.slice(0, targetIndex), node, ...relinked.slice(targetIndex)]
  const nextState: LinkedListState = {
    ...state,
    nodes,
    headId: oldPrev ? state.headId : node.id,
    nextNodeId,
    nextAddress,
  }
  const complexity = constantTime("Inserting before a known node rewires at most four pointers.")

  return buildFrames(state, [
    {
      state,
      operation,
      phase: "locate",
      detail: `Found ${target.value}; insert ${value} before it.`,
      complexity,
      highlights: [
        nodeHighlight(target.id, "source"),
        ...edgeHighlight(target.prevId ? target.id : null, "prev", "source"),
      ],
    },
    {
      state: nextState,
      operation,
      phase: "link",
      detail: oldPrev
        ? `Point ${value} between ${oldPrev.value} and ${target.value}, then rewire their pointers.`
        : `Point ${value} before ${target.value} and move the head.`,
      complexity,
      highlights: [
        nodeHighlight(node.id, "insert"),
        ...edgeHighlight(oldPrev ? node.id : null, "prev", "insert"),
        ...edgeHighlight(node.id, "next", "insert"),
        ...edgeHighlight(target.id, "prev", "insert"),
        ...edgeHighlight(oldPrev?.id ?? null, "next", "insert"),
      ],
    },
    {
      state: nextState,
      operation,
      phase: "complete",
      detail: `Inserted ${value} before ${target.value}; size ${nodes.length}.`,
      complexity,
      highlights: [nodeHighlight(node.id, "active")],
      feedback: "success",
    },
  ])
}

export function removeLinkedListNode(state: LinkedListState, targetId: string): LinkedListFrame[] {
  const operation = "remove"
  const target = findLinkedListNode(state, targetId)

  if (!target) {
    return buildFrames(state, [
      {
        state,
        operation,
        phase: "missing",
        detail: `Cannot remove "${targetId}"; that node is not in the list.`,
        complexity: constantTime("A failed removal stops as soon as the target is missing."),
        feedback: "error",
      },
    ])
  }

  const index = linkedListNodeIndex(state, target.id)
  const prev = state.nodes[index - 1] ?? null
  const next = state.nodes[index + 1] ?? null
  const nodes = state.nodes
    .filter((node) => node.id !== target.id)
    .map((node) => {
      if (prev && node.id === prev.id) {
        return { ...node, nextId: next?.id ?? null }
      }

      if (next && node.id === next.id) {
        return { ...node, prevId: prev?.id ?? null }
      }

      return node
    })
  const nextState: LinkedListState = {
    ...state,
    nodes,
    headId: state.headId === target.id ? (next?.id ?? null) : state.headId,
    tailId: state.tailId === target.id ? (prev?.id ?? null) : state.tailId,
  }
  const complexity = constantTime("Removing a known node rewires at most four pointers.")
  const unlinkDetail =
    prev && next
      ? `Connect ${prev.value} directly to ${next.value}.`
      : next
        ? `Move the head to ${next.value}.`
        : prev
          ? `Move the tail to ${prev.value}.`
          : "Release the only node; the list becomes empty."

  return buildFrames(state, [
    {
      state,
      operation,
      phase: "locate",
      detail: `Found ${target.value}; unlink it from its neighbors.`,
      complexity,
      highlights: [
        nodeHighlight(target.id, "remove"),
        ...edgeHighlight(target.prevId ? target.id : null, "prev", "remove"),
        ...edgeHighlight(target.nextId ? target.id : null, "next", "remove"),
      ],
    },
    {
      state: nextState,
      operation,
      phase: "unlink",
      detail: unlinkDetail,
      complexity,
      highlights: [
        ...(prev ? [nodeHighlight(prev.id, "active")] : []),
        ...(next ? [nodeHighlight(next.id, "active")] : []),
        ...edgeHighlight(prev?.id ?? null, "next", "insert"),
        ...edgeHighlight(next?.id ?? null, "prev", "insert"),
      ],
    },
    {
      state: nextState,
      operation,
      phase: "complete",
      detail:
        nodes.length > 0
          ? `Removed ${target.value}; ${nodes.length} nodes remain.`
          : `Removed ${target.value}; the list is empty.`,
      complexity,
      feedback: "success",
    },
  ])
}

export function traverseLinkedList(state: LinkedListState): LinkedListFrame[] {
  const operation = "traverse"
  const complexity = linearTime("Traversal follows every next pointer from head to tail.")

  if (isLinkedListEmpty(state)) {
    return buildFrames(state, [
      {
        state,
        operation,
        phase: "empty",
        detail: "Cannot traverse an empty list.",
        complexity,
        feedback: "warning",
      },
    ])
  }

  const specs: LinkedListFrameSpec[] = []
  const visited = new Set<string>()
  let current: LinkedListNode | null = linkedListHeadNode(state)
  let step = 0

  while (current && !visited.has(current.id)) {
    visited.add(current.id)
    const next = findLinkedListNode(state, current.nextId)

    specs.push({
      state,
      operation,
      phase: step === 0 ? "start" : "visit",
      detail: `Visit ${current.value}; node ${step + 1} of ${state.nodes.length}.`,
      complexity,
      highlights: [
        nodeHighlight(current.id, "active"),
        ...edgeHighlight(next ? current.id : null, "next", "pointer"),
      ],
    })

    current = next
    step += 1
  }

  const reachedEnd = visited.size === state.nodes.length

  specs.push({
    state,
    operation,
    phase: "complete",
    detail: reachedEnd
      ? `Traversal visited all ${visited.size} nodes and reached the tail.`
      : `Traversal stopped after ${visited.size} of ${state.nodes.length} nodes at a missing pointer.`,
    complexity,
    feedback: reachedEnd ? "success" : "warning",
  })

  return buildFrames(state, specs)
}

function setLinkedListPointer(
  state: LinkedListState,
  nodeId: string,
  direction: LinkedListDirection,
  targetId: string | null,
): LinkedListState {
  return {
    ...state,
    nodes: state.nodes.map((node) => {
      if (node.id !== nodeId) {
        return node
      }

      return direction === "next" ? { ...node, nextId: targetId } : { ...node, prevId: targetId }
    }),
  }
}

function pointerTargetId(node: LinkedListNode, direction: LinkedListDirection): string | null {
  return direction === "next" ? node.nextId : node.prevId
}

function issueSummary(count: number): string {
  return `${count} pointer issue${count === 1 ? "" : "s"}`
}

export function detachLinkedListPointer(
  state: LinkedListState,
  nodeId: string,
  direction: LinkedListDirection,
): LinkedListFrame[] {
  const operation = "detach"
  const node = findLinkedListNode(state, nodeId)

  if (!node) {
    return buildFrames(state, [
      {
        state,
        operation,
        phase: "missing",
        detail: `Cannot detach a pointer from "${nodeId}"; that node is not in the list.`,
        complexity: constantTime("A failed detach stops as soon as the node is missing."),
        feedback: "error",
      },
    ])
  }

  const targetId = pointerTargetId(node, direction)

  if (targetId === null) {
    return buildFrames(state, [
      {
        state,
        operation,
        phase: "noop",
        detail: `The ${direction} pointer of ${node.value} is already null.`,
        complexity: constantTime("Checking an already-null pointer takes constant time."),
        feedback: "warning",
      },
    ])
  }

  const nextState = setLinkedListPointer(state, nodeId, direction, null)
  const issueCount = checkLinkedListIntegrity(nextState).issues.length
  const complexity = constantTime("Detaching one pointer clears a single link.")

  return buildFrames(state, [
    {
      state,
      operation,
      phase: "detach",
      detail: `Detach ${node.value}.${direction}; the link becomes one-sided.`,
      complexity,
      highlights: [
        { target: "node", id: node.id, role: "active" },
        { target: "edge", id: linkedListEdgeId(node.id, direction), role: "remove" },
      ],
      feedback: "warning",
    },
    {
      state: nextState,
      operation,
      phase: "broken",
      detail: `Detached ${node.value}.${direction}; ${issueSummary(issueCount)} detected.`,
      complexity,
      highlights: [{ target: "node", id: node.id, role: "active" }],
      feedback: "warning",
    },
  ])
}

export function relinkLinkedListPointer(
  state: LinkedListState,
  nodeId: string,
  direction: LinkedListDirection,
  targetId: string,
): LinkedListFrame[] {
  const operation = "relink"
  const node = findLinkedListNode(state, nodeId)

  if (!node) {
    return buildFrames(state, [
      {
        state,
        operation,
        phase: "missing",
        detail: `Cannot relink a pointer from "${nodeId}"; that node is not in the list.`,
        complexity: constantTime("A failed relink stops as soon as the node is missing."),
        feedback: "error",
      },
    ])
  }

  const target = findLinkedListNode(state, targetId)

  if (!target) {
    return buildFrames(state, [
      {
        state,
        operation,
        phase: "missing",
        detail: `Cannot relink ${node.value}.${direction} to "${targetId}"; that node is not in the list.`,
        complexity: constantTime("A failed relink stops as soon as the target is missing."),
        feedback: "error",
      },
    ])
  }

  const currentTargetId = pointerTargetId(node, direction)

  if (currentTargetId === targetId) {
    return buildFrames(state, [
      {
        state,
        operation,
        phase: "noop",
        detail: `${node.value}.${direction} already points to ${target.value}.`,
        complexity: constantTime("Checking an existing link takes constant time."),
        feedback: "warning",
      },
    ])
  }

  const nextState = setLinkedListPointer(state, nodeId, direction, targetId)
  const integrity = checkLinkedListIntegrity(nextState)
  const issueCount = integrity.issues.length
  const complexity = constantTime("Relinking one pointer rewires a single link.")
  const oldEdgeHighlights: Highlight[] =
    currentTargetId === null
      ? []
      : [{ target: "edge", id: linkedListEdgeId(node.id, direction), role: "remove" }]

  return buildFrames(state, [
    {
      state,
      operation,
      phase: "relink",
      detail: `Relink ${node.value}.${direction} to ${target.value}.`,
      complexity,
      highlights: [
        { target: "node", id: node.id, role: "source" },
        { target: "node", id: target.id, role: "target" },
        ...oldEdgeHighlights,
      ],
    },
    {
      state: nextState,
      operation,
      phase: integrity.status === "ok" ? "complete" : "warning",
      detail:
        integrity.status === "ok"
          ? `Relinked ${node.value}.${direction} to ${target.value}; integrity restored.`
          : `Relinked ${node.value}.${direction} to ${target.value}; ${issueSummary(issueCount)} still ${
              issueCount === 1 ? "remains" : "remain"
            }.`,
      complexity,
      highlights: [
        { target: "node", id: node.id, role: "source" },
        { target: "node", id: target.id, role: "target" },
        { target: "edge", id: linkedListEdgeId(node.id, direction), role: "insert" },
      ],
      feedback: integrity.status === "ok" ? "success" : "warning",
    },
  ])
}

export function repairLinkedListLinks(state: LinkedListState): LinkedListFrame[] {
  const operation = "repair"
  const integrity = checkLinkedListIntegrity(state)

  if (integrity.status === "ok") {
    return buildFrames(state, [
      {
        state,
        operation,
        phase: "noop",
        detail: "Every pointer already matches visual order.",
        complexity: linearTime("Repair scans every node before rebuilding links."),
        feedback: "warning",
      },
    ])
  }

  const nodes = state.nodes.map((node, index) => ({
    ...node,
    prevId: state.nodes[index - 1]?.id ?? null,
    nextId: state.nodes[index + 1]?.id ?? null,
  }))
  const nextState: LinkedListState = {
    ...state,
    nodes,
    headId: nodes[0]?.id ?? null,
    tailId: nodes[nodes.length - 1]?.id ?? null,
  }
  const complexity = linearTime("Repair rewires every node from visual order.")
  const issueNodes = [
    ...new Set(
      integrity.issues
        .map((issue) => issue.nodeId)
        .filter((nodeId): nodeId is string => nodeId !== null),
    ),
  ]

  return buildFrames(state, [
    {
      state,
      operation,
      phase: "scan",
      detail: `${issueSummary(integrity.issues.length)} found; rebuild links from visual order.`,
      complexity,
      highlights: issueNodes.map<Highlight>((nodeId) => ({
        target: "node",
        id: nodeId,
        role: "pointer",
      })),
      feedback: "warning",
    },
    {
      state: nextState,
      operation,
      phase: "repair",
      detail: `Repaired ${issueSummary(integrity.issues.length)}; every node matches visual order.`,
      complexity,
      highlights: [],
      feedback: "success",
    },
  ])
}

export const linkedListEngine = {
  createState: createLinkedListState,
  checkIntegrity: checkLinkedListIntegrity,
  links: linkedListLinks,
  edgeId: linkedListEdgeId,
  head: linkedListHeadNode,
  tail: linkedListTailNode,
  find: findLinkedListNode,
  prepend: prependLinkedList,
  append: appendLinkedList,
  insertAfter: insertLinkedListAfter,
  insertBefore: insertLinkedListBefore,
  remove: removeLinkedListNode,
  traverse: traverseLinkedList,
  detach: detachLinkedListPointer,
  relink: relinkLinkedListPointer,
  repair: repairLinkedListLinks,
} as const
