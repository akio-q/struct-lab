import { STRUCTURE_IDS, type StructureId } from "./types"

export interface StructureMeta {
  id: StructureId
  label: string
  shortLabel: string
  description: string
}

export const DEFAULT_STRUCTURE_ID: StructureId = "array"

export const structureRegistry = {
  array: {
    id: "array",
    label: "Array",
    shortLabel: "Array",
    description: "Contiguous storage with indexed access, capacity, and dynamic resizing.",
  },
  stack: {
    id: "stack",
    label: "Stack",
    shortLabel: "Stack",
    description: "A last-in, first-out chamber with push, pop, and peek.",
  },
  queue: {
    id: "queue",
    label: "Queue",
    shortLabel: "Queue",
    description: "A first-in, first-out pipeline with enqueue and dequeue.",
  },
  deque: {
    id: "deque",
    label: "Deque",
    shortLabel: "Deque",
    description: "A double-ended pipeline that pushes and pops at both ends.",
  },
  "linked-list": {
    id: "linked-list",
    label: "Doubly Linked List",
    shortLabel: "Linked List",
    description: "Nodes linked in both directions with pointer rewiring and traversal.",
  },
} as const satisfies Record<StructureId, StructureMeta>

export const structureList: readonly StructureMeta[] = STRUCTURE_IDS.map(
  (id) => structureRegistry[id],
)

export function isStructureId(value: unknown): value is StructureId {
  return typeof value === "string" && (STRUCTURE_IDS as readonly string[]).includes(value)
}

export function resolveStructureId(value: string | null | undefined): StructureId {
  return isStructureId(value) ? value : DEFAULT_STRUCTURE_ID
}

export function getStructureMeta(id: StructureId): StructureMeta {
  return structureRegistry[id]
}

export function structureHref(id: StructureId): string {
  return `/?structure=${id}`
}
