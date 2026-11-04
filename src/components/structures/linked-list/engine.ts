import type { TraceFrame } from "@/lib/structures/types"

export interface LinkedListNode {
  id: string
  value: number
  address: string
  prevId: string | null
  nextId: string | null
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

export const linkedListEngine = {
  createState: createLinkedListState,
  checkIntegrity: checkLinkedListIntegrity,
  head: linkedListHeadNode,
  tail: linkedListTailNode,
  find: findLinkedListNode,
} as const
