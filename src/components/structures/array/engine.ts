import { constantTime, linearTime } from "@/lib/structures/complexity"
import type { Complexity, Feedback, Highlight, TraceFrame } from "@/lib/structures/types"

export type ArrayMode = "static" | "dynamic"

export interface ArrayItem {
  id: string
  value: number
}

export interface ArrayState {
  mode: ArrayMode
  capacity: number
  items: readonly ArrayItem[]
  nextItemId: number
  nextFrameId: number
}

export type ArrayFrame = TraceFrame<ArrayState>

export interface ArrayEngineOptions {
  mode?: ArrayMode
  capacity?: number
  initialValues?: readonly number[]
}

const DEFAULT_STATIC_CAPACITY = 8
const DEFAULT_DYNAMIC_CAPACITY = 4
const MIN_CAPACITY = 1

function itemId(index: number): string {
  return `array-item-${index}`
}

export function arraySlotId(index: number): string {
  return `array-slot-${index}`
}

function normalizeCapacity(capacity: number): number {
  if (!Number.isFinite(capacity)) {
    return MIN_CAPACITY
  }

  return Math.max(MIN_CAPACITY, Math.trunc(capacity))
}

function isArrayIndex(state: ArrayState, index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < state.items.length
}

function isInsertIndex(state: ArrayState, index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index <= state.items.length
}

function describeInvalidIndex(
  state: ArrayState,
  index: number,
  action: "access" | "remove" = "access",
): string {
  if (state.items.length === 0) {
    return `Cannot ${action} index ${index}; the array is empty.`
  }

  return `Index ${index} is out of bounds (0..${state.items.length - 1}).`
}

export function isArrayEmpty(state: ArrayState): boolean {
  return state.items.length === 0
}

export function isArrayFull(state: ArrayState): boolean {
  return state.items.length >= state.capacity
}

/**
 * Creates the initial snapshot for an array. Static arrays keep the requested
 * capacity forever; dynamic arrays grow before the initial values are stored
 * when the requested capacity is too small.
 */
export function createArrayState({
  mode = "dynamic",
  capacity,
  initialValues = [],
}: ArrayEngineOptions = {}): ArrayState {
  const requestedCapacity = normalizeCapacity(
    capacity ?? (mode === "static" ? DEFAULT_STATIC_CAPACITY : DEFAULT_DYNAMIC_CAPACITY),
  )

  if (mode === "static" && initialValues.length > requestedCapacity) {
    throw new RangeError(
      `Static capacity ${requestedCapacity} cannot hold ${initialValues.length} initial items.`,
    )
  }

  let effectiveCapacity = requestedCapacity

  if (mode === "dynamic") {
    while (effectiveCapacity < initialValues.length) {
      effectiveCapacity *= 2
    }
  }

  const items: ArrayItem[] = initialValues.map((value, index) => ({
    id: itemId(index),
    value,
  }))

  return {
    mode,
    capacity: effectiveCapacity,
    items,
    nextItemId: items.length,
    nextFrameId: 0,
  }
}

interface FrameSpec {
  state: ArrayState
  operation: string
  phase: string
  detail: string
  complexity: Complexity
  highlights?: readonly Highlight[]
  feedback?: Feedback
}

function buildFrames(initialState: ArrayState, specs: readonly FrameSpec[]): ArrayFrame[] {
  let nextFrameId = initialState.nextFrameId

  return specs.map((spec) => {
    const id = `array-frame-${nextFrameId}`
    const state: ArrayState = { ...spec.state, nextFrameId: nextFrameId + 1 }
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

function growCapacity(state: ArrayState): ArrayState {
  return { ...state, capacity: state.capacity * 2 }
}

function growthSpecs(state: ArrayState, operation: string): FrameSpec[] {
  const nextState = growCapacity(state)
  const sourceHighlights: Highlight[] = state.items.map((item) => ({
    target: "item",
    id: item.id,
    role: "source",
  }))
  const targetHighlights: Highlight[] = state.items.map((item) => ({
    target: "item",
    id: item.id,
    role: "target",
  }))

  return [
    {
      state,
      operation,
      phase: "grow",
      detail: `Capacity ${state.capacity} is full; allocate ${nextState.capacity} slots.`,
      complexity: linearTime("Reallocation copies every item into a larger buffer."),
      highlights: sourceHighlights,
      feedback: "neutral",
    },
    {
      state: nextState,
      operation,
      phase: "copy",
      detail: `Copied ${state.items.length} items into the new buffer.`,
      complexity: linearTime("Reallocation copies every item into a larger buffer."),
      highlights: targetHighlights,
      feedback: "neutral",
    },
  ]
}

function overflowFrame(state: ArrayState, operation: string, value: number): ArrayFrame[] {
  return buildFrames(state, [
    {
      state,
      operation,
      phase: "overflow",
      detail: `Static capacity ${state.capacity} is full; cannot ${operation} ${value}.`,
      complexity: constantTime(`A failed ${operation} checks the capacity and stops.`),
      highlights: [{ target: "slot", id: arraySlotId(state.capacity - 1), role: "active" }],
      feedback: "error",
    },
  ])
}

export function appendArray(state: ArrayState, value: number): ArrayFrame[] {
  const operation = "append"
  const specs: FrameSpec[] = []
  let baseState = state

  if (isArrayFull(baseState)) {
    if (baseState.mode === "static") {
      return overflowFrame(state, operation, value)
    }

    specs.push(...growthSpecs(baseState, operation))
    baseState = growCapacity(baseState)
  }

  const index = baseState.items.length
  const item: ArrayItem = { id: itemId(baseState.nextItemId), value }
  const nextState: ArrayState = {
    ...baseState,
    items: [...baseState.items, item],
    nextItemId: baseState.nextItemId + 1,
  }

  specs.push({
    state: nextState,
    operation,
    phase: "write",
    detail: `Write ${value} at index ${index}.`,
    complexity: constantTime("Appending writes one slot when capacity is available."),
    highlights: [
      { target: "item", id: item.id, role: "insert" },
      { target: "slot", id: arraySlotId(index), role: "insert" },
    ],
    feedback: "neutral",
  })

  specs.push({
    state: nextState,
    operation,
    phase: "complete",
    detail: `Appended ${value}; length ${nextState.items.length} of ${nextState.capacity}.`,
    complexity: constantTime("Appending writes one slot when capacity is available."),
    highlights: [{ target: "item", id: item.id, role: "active" }],
    feedback: "success",
  })

  return buildFrames(state, specs)
}

export function popArray(state: ArrayState): ArrayFrame[] {
  const operation = "pop"

  if (isArrayEmpty(state)) {
    return buildFrames(state, [
      {
        state,
        operation,
        phase: "underflow",
        detail: "Cannot pop from an empty array.",
        complexity: constantTime("A failed pop checks the length and stops."),
        feedback: "error",
      },
    ])
  }

  const index = state.items.length - 1
  const item = state.items[index]
  const nextState: ArrayState = {
    ...state,
    items: state.items.slice(0, -1),
  }

  return buildFrames(state, [
    {
      state,
      operation,
      phase: "read",
      detail: `Read items[${index}] = ${item.value}.`,
      complexity: constantTime("Popping reads the last slot."),
      highlights: [
        { target: "item", id: item.id, role: "remove" },
        { target: "slot", id: arraySlotId(index), role: "remove" },
      ],
      feedback: "neutral",
    },
    {
      state: nextState,
      operation,
      phase: "remove",
      detail: `Removed ${item.value}; length ${nextState.items.length} of ${nextState.capacity}.`,
      complexity: constantTime("Popping reads the last slot."),
      feedback: "success",
    },
  ])
}

export function accessArray(state: ArrayState, index: number): ArrayFrame[] {
  const operation = "access"

  if (!isArrayIndex(state, index)) {
    return buildFrames(state, [
      {
        state,
        operation,
        phase: "bounds",
        detail: describeInvalidIndex(state, index),
        complexity: constantTime("Indexed access validates the index in constant time."),
        feedback: "error",
      },
    ])
  }

  const item = state.items[index]

  return buildFrames(state, [
    {
      state,
      operation,
      phase: "read",
      detail: `items[${index}] = ${item.value}.`,
      complexity: constantTime("Indexed access jumps directly to the slot."),
      highlights: [
        { target: "item", id: item.id, role: "active" },
        { target: "slot", id: arraySlotId(index), role: "active" },
      ],
      feedback: "success",
    },
  ])
}

export function insertArray(state: ArrayState, index: number, value: number): ArrayFrame[] {
  const operation = "insert"

  if (!isInsertIndex(state, index)) {
    return buildFrames(state, [
      {
        state,
        operation,
        phase: "bounds",
        detail: `Index ${index} is out of bounds for insertion (0..${state.items.length}).`,
        complexity: linearTime("Insertion shifts the items after the index."),
        feedback: "error",
      },
    ])
  }

  const specs: FrameSpec[] = []
  let baseState = state

  if (isArrayFull(baseState)) {
    if (baseState.mode === "static") {
      return overflowFrame(state, operation, value)
    }

    specs.push(...growthSpecs(baseState, operation))
    baseState = growCapacity(baseState)
  }

  const shiftCount = baseState.items.length - index
  const item: ArrayItem = { id: itemId(baseState.nextItemId), value }
  const nextState: ArrayState = {
    ...baseState,
    items: [...baseState.items.slice(0, index), item, ...baseState.items.slice(index)],
    nextItemId: baseState.nextItemId + 1,
  }

  specs.push({
    state: baseState,
    operation,
    phase: "prepare",
    detail:
      shiftCount > 0
        ? `Make room at index ${index}; shift ${shiftCount} items right.`
        : `Insert at index ${index}; no items need to shift.`,
    complexity: linearTime("Insertion shifts the items after the index."),
    highlights: [
      { target: "slot", id: arraySlotId(index), role: "insert" },
      ...baseState.items.slice(index).map<Highlight>((existing) => ({
        target: "item",
        id: existing.id,
        role: "source",
      })),
    ],
    feedback: "neutral",
  })

  specs.push({
    state: nextState,
    operation,
    phase: shiftCount > 0 ? "shift" : "write",
    detail:
      shiftCount > 0
        ? `Shifted ${shiftCount} items right and wrote ${value} at index ${index}.`
        : `Wrote ${value} at index ${index}.`,
    complexity: linearTime("Insertion shifts the items after the index."),
    highlights: [
      { target: "item", id: item.id, role: "insert" },
      { target: "slot", id: arraySlotId(index), role: "insert" },
      ...nextState.items.slice(index + 1).map<Highlight>((shifted) => ({
        target: "item",
        id: shifted.id,
        role: "target",
      })),
    ],
    feedback: "neutral",
  })

  specs.push({
    state: nextState,
    operation,
    phase: "complete",
    detail: `Inserted ${value} at index ${index}; length ${nextState.items.length} of ${nextState.capacity}.`,
    complexity: linearTime("Insertion shifts the items after the index."),
    highlights: [{ target: "item", id: item.id, role: "active" }],
    feedback: "success",
  })

  return buildFrames(state, specs)
}

export function removeArray(state: ArrayState, index: number): ArrayFrame[] {
  const operation = "remove"

  if (!isArrayIndex(state, index)) {
    return buildFrames(state, [
      {
        state,
        operation,
        phase: "bounds",
        detail: describeInvalidIndex(state, index, "remove"),
        complexity: linearTime("Removal shifts the items after the index."),
        feedback: "error",
      },
    ])
  }

  const item = state.items[index]
  const shiftCount = state.items.length - index - 1
  const nextState: ArrayState = {
    ...state,
    items: state.items.filter((_, itemIndex) => itemIndex !== index),
  }

  return buildFrames(state, [
    {
      state,
      operation,
      phase: "read",
      detail: `Read items[${index}] = ${item.value}.`,
      complexity: linearTime("Removal shifts the items after the index."),
      highlights: [
        { target: "item", id: item.id, role: "remove" },
        { target: "slot", id: arraySlotId(index), role: "remove" },
      ],
      feedback: "neutral",
    },
    {
      state: nextState,
      operation,
      phase: shiftCount > 0 ? "shift" : "remove",
      detail:
        shiftCount > 0
          ? `Removed ${item.value} and shifted ${shiftCount} items left.`
          : `Removed ${item.value}; no items needed to shift.`,
      complexity: linearTime("Removal shifts the items after the index."),
      highlights: nextState.items.slice(index).map<Highlight>((shifted) => ({
        target: "item",
        id: shifted.id,
        role: "target",
      })),
      feedback: "neutral",
    },
    {
      state: nextState,
      operation,
      phase: "complete",
      detail: `Removed ${item.value}; length ${nextState.items.length} of ${nextState.capacity}.`,
      complexity: linearTime("Removal shifts the items after the index."),
      feedback: "success",
    },
  ])
}

export function clearArray(state: ArrayState): ArrayFrame[] {
  const operation = "clear"

  if (isArrayEmpty(state)) {
    return buildFrames(state, [
      {
        state,
        operation,
        phase: "noop",
        detail: "The array is already empty.",
        complexity: constantTime("Clearing checks the length before releasing slots."),
        feedback: "warning",
      },
    ])
  }

  const nextState: ArrayState = { ...state, items: [] }

  return buildFrames(state, [
    {
      state,
      operation,
      phase: "release",
      detail: `Release ${state.items.length} occupied slots.`,
      complexity: linearTime("Clearing releases every occupied slot."),
      highlights: state.items.map<Highlight>((item) => ({
        target: "item",
        id: item.id,
        role: "remove",
      })),
      feedback: "neutral",
    },
    {
      state: nextState,
      operation,
      phase: "reset",
      detail: `Cleared the array; capacity ${nextState.capacity} is unchanged.`,
      complexity: linearTime("Clearing releases every occupied slot."),
      feedback: "success",
    },
  ])
}

export function setArrayMode(state: ArrayState, mode: ArrayMode): ArrayFrame[] {
  const operation = "mode"

  if (state.mode === mode) {
    return buildFrames(state, [
      {
        state,
        operation,
        phase: "noop",
        detail: `Already in ${mode} mode.`,
        complexity: constantTime("Changing modes only reconfigures the capacity policy."),
        feedback: "neutral",
      },
    ])
  }

  const nextState: ArrayState = { ...state, mode }
  const detail =
    mode === "static"
      ? `Switched to static mode with fixed capacity ${state.capacity}.`
      : `Switched to dynamic mode; capacity ${state.capacity} will double when full.`

  return buildFrames(state, [
    {
      state: nextState,
      operation,
      phase: "configure",
      detail,
      complexity: constantTime("Changing modes only reconfigures the capacity policy."),
      feedback: "success",
    },
  ])
}

export const arrayEngine = {
  createState: createArrayState,
  append: appendArray,
  pop: popArray,
  access: accessArray,
  insert: insertArray,
  remove: removeArray,
  clear: clearArray,
  setMode: setArrayMode,
} as const
