import { constantTime, linearTime } from "@/lib/structures/complexity"
import type { Complexity, Feedback, Highlight, TraceFrame } from "@/lib/structures/types"

export interface StackItem {
  id: string
  value: number
}

export interface StackState {
  capacity: number
  items: readonly StackItem[]
  nextItemId: number
  nextFrameId: number
}

export type StackFrame = TraceFrame<StackState>

export interface StackEngineOptions {
  capacity?: number
  initialValues?: readonly number[]
}

const DEFAULT_CAPACITY = 6
const MIN_CAPACITY = 1

function itemId(index: number): string {
  return `stack-item-${index}`
}

export function stackSlotId(index: number): string {
  return `stack-slot-${index}`
}

function normalizeCapacity(capacity: number): number {
  if (!Number.isFinite(capacity)) {
    return MIN_CAPACITY
  }

  return Math.max(MIN_CAPACITY, Math.trunc(capacity))
}

export function isStackEmpty(state: StackState): boolean {
  return state.items.length === 0
}

export function isStackFull(state: StackState): boolean {
  return state.items.length >= state.capacity
}

/** Returns the top index, or `-1` when the stack is empty. */
export function stackTopIndex(state: StackState): number {
  return state.items.length - 1
}

/** Returns the top item, or `null` when the stack is empty. */
export function stackTopItem(state: StackState): StackItem | null {
  return state.items[state.items.length - 1] ?? null
}

/**
 * Creates the initial snapshot for a fixed-capacity stack. A stack overflows
 * instead of growing, so initial values that exceed the capacity are rejected.
 */
export function createStackState({
  capacity,
  initialValues = [],
}: StackEngineOptions = {}): StackState {
  const effectiveCapacity = normalizeCapacity(capacity ?? DEFAULT_CAPACITY)

  if (initialValues.length > effectiveCapacity) {
    throw new RangeError(
      `Stack capacity ${effectiveCapacity} cannot hold ${initialValues.length} initial items.`,
    )
  }

  const items: StackItem[] = initialValues.map((value, index) => ({
    id: itemId(index),
    value,
  }))

  return {
    capacity: effectiveCapacity,
    items,
    nextItemId: items.length,
    nextFrameId: 0,
  }
}

interface FrameSpec {
  state: StackState
  operation: string
  phase: string
  detail: string
  complexity: Complexity
  highlights?: readonly Highlight[]
  feedback?: Feedback
}

function buildFrames(initialState: StackState, specs: readonly FrameSpec[]): StackFrame[] {
  let nextFrameId = initialState.nextFrameId

  return specs.map((spec) => {
    const id = `stack-frame-${nextFrameId}`
    const state: StackState = { ...spec.state, nextFrameId: nextFrameId + 1 }
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

export function pushStack(state: StackState, value: number): StackFrame[] {
  const operation = "push"

  if (isStackFull(state)) {
    return buildFrames(state, [
      {
        state,
        operation,
        phase: "overflow",
        detail: `Capacity ${state.capacity} is full; cannot push ${value}.`,
        complexity: constantTime("A failed push checks the capacity and stops."),
        highlights: [{ target: "slot", id: stackSlotId(state.capacity - 1), role: "active" }],
        feedback: "error",
      },
    ])
  }

  const index = state.items.length
  const item: StackItem = { id: itemId(state.nextItemId), value }
  const nextState: StackState = {
    ...state,
    items: [...state.items, item],
    nextItemId: state.nextItemId + 1,
  }

  return buildFrames(state, [
    {
      state: nextState,
      operation,
      phase: "write",
      detail: `Push ${value} onto index ${index}.`,
      complexity: constantTime("Push writes one slot at the top of the stack."),
      highlights: [
        { target: "item", id: item.id, role: "insert" },
        { target: "slot", id: stackSlotId(index), role: "insert" },
      ],
      feedback: "neutral",
    },
    {
      state: nextState,
      operation,
      phase: "complete",
      detail: `Pushed ${value}; top is index ${index}, depth ${nextState.items.length} of ${nextState.capacity}.`,
      complexity: constantTime("Push writes one slot at the top of the stack."),
      highlights: [{ target: "item", id: item.id, role: "active" }],
      feedback: "success",
    },
  ])
}

export function popStack(state: StackState): StackFrame[] {
  const operation = "pop"

  if (isStackEmpty(state)) {
    return buildFrames(state, [
      {
        state,
        operation,
        phase: "underflow",
        detail: "Cannot pop from an empty stack.",
        complexity: constantTime("A failed pop checks the depth and stops."),
        feedback: "error",
      },
    ])
  }

  const index = state.items.length - 1
  const item = state.items[index]
  const nextState: StackState = { ...state, items: state.items.slice(0, -1) }
  const newTop = nextState.items[nextState.items.length - 1]

  return buildFrames(state, [
    {
      state,
      operation,
      phase: "read",
      detail: `Read the top item at index ${index}: ${item.value}.`,
      complexity: constantTime("Pop removes the top item in constant time."),
      highlights: [
        { target: "item", id: item.id, role: "remove" },
        { target: "slot", id: stackSlotId(index), role: "remove" },
      ],
      feedback: "neutral",
    },
    {
      state: nextState,
      operation,
      phase: "remove",
      detail: newTop
        ? `Popped ${item.value}; top is index ${nextState.items.length - 1}, depth ${nextState.items.length} of ${nextState.capacity}.`
        : `Popped ${item.value}; the stack is empty.`,
      complexity: constantTime("Pop removes the top item in constant time."),
      highlights: newTop ? [{ target: "item", id: newTop.id, role: "active" }] : [],
      feedback: "success",
    },
  ])
}

export function peekStack(state: StackState): StackFrame[] {
  const operation = "peek"

  if (isStackEmpty(state)) {
    return buildFrames(state, [
      {
        state,
        operation,
        phase: "underflow",
        detail: "Cannot peek an empty stack.",
        complexity: constantTime("Peek checks the depth and reads the top item."),
        feedback: "error",
      },
    ])
  }

  const index = state.items.length - 1
  const item = state.items[index]

  return buildFrames(state, [
    {
      state,
      operation,
      phase: "peek",
      detail: `Top is index ${index}: ${item.value}.`,
      complexity: constantTime("Peek reads the top item without removing it."),
      highlights: [
        { target: "item", id: item.id, role: "active" },
        { target: "slot", id: stackSlotId(index), role: "active" },
      ],
      feedback: "success",
    },
  ])
}

export function clearStack(state: StackState): StackFrame[] {
  const operation = "clear"

  if (isStackEmpty(state)) {
    return buildFrames(state, [
      {
        state,
        operation,
        phase: "noop",
        detail: "The stack is already empty.",
        complexity: constantTime("Clearing checks the depth before releasing slots."),
        feedback: "warning",
      },
    ])
  }

  const nextState: StackState = { ...state, items: [] }

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
      detail: `Cleared the stack; capacity ${nextState.capacity} is unchanged.`,
      complexity: linearTime("Clearing releases every occupied slot."),
      feedback: "success",
    },
  ])
}

export const stackEngine = {
  createState: createStackState,
  push: pushStack,
  pop: popStack,
  peek: peekStack,
  clear: clearStack,
} as const
