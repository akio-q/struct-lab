import { constantTime, linearTime } from "@/lib/structures/complexity"
import type { Complexity, Feedback, Highlight, TraceFrame } from "@/lib/structures/types"

export interface DequeItem {
  id: string
  value: number
}

export interface DequeState {
  capacity: number
  items: readonly DequeItem[]
  nextItemId: number
  nextFrameId: number
}

export type DequeFrame = TraceFrame<DequeState>

export interface DequeEngineOptions {
  capacity?: number
  initialValues?: readonly number[]
}

const DEFAULT_CAPACITY = 6
const MIN_CAPACITY = 1

function itemId(index: number): string {
  return `deque-item-${index}`
}

export function dequeSlotId(index: number): string {
  return `deque-slot-${index}`
}

function normalizeCapacity(capacity: number): number {
  if (!Number.isFinite(capacity)) {
    return MIN_CAPACITY
  }

  return Math.max(MIN_CAPACITY, Math.trunc(capacity))
}

export function isDequeEmpty(state: DequeState): boolean {
  return state.items.length === 0
}

export function isDequeFull(state: DequeState): boolean {
  return state.items.length >= state.capacity
}

/** Returns the front index, or `-1` when the deque is empty. */
export function dequeFrontIndex(state: DequeState): number {
  return isDequeEmpty(state) ? -1 : 0
}

/** Returns the back index, or `-1` when the deque is empty. */
export function dequeBackIndex(state: DequeState): number {
  return state.items.length - 1
}

/** Returns the front item, or `null` when the deque is empty. */
export function dequeFrontItem(state: DequeState): DequeItem | null {
  return state.items[0] ?? null
}

/** Returns the back item, or `null` when the deque is empty. */
export function dequeBackItem(state: DequeState): DequeItem | null {
  return state.items[state.items.length - 1] ?? null
}

/**
 * Creates the initial snapshot for a fixed-capacity deque. A deque overflows
 * instead of growing, so initial values that exceed the capacity are rejected.
 */
export function createDequeState({
  capacity,
  initialValues = [],
}: DequeEngineOptions = {}): DequeState {
  const effectiveCapacity = normalizeCapacity(capacity ?? DEFAULT_CAPACITY)

  if (initialValues.length > effectiveCapacity) {
    throw new RangeError(
      `Deque capacity ${effectiveCapacity} cannot hold ${initialValues.length} initial items.`,
    )
  }

  const items: DequeItem[] = initialValues.map((value, index) => ({
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
  state: DequeState
  operation: string
  phase: string
  detail: string
  complexity: Complexity
  highlights?: readonly Highlight[]
  feedback?: Feedback
}

function buildFrames(initialState: DequeState, specs: readonly FrameSpec[]): DequeFrame[] {
  let nextFrameId = initialState.nextFrameId

  return specs.map((spec) => {
    const id = `deque-frame-${nextFrameId}`
    const state: DequeState = { ...spec.state, nextFrameId: nextFrameId + 1 }
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

export function pushFrontDeque(state: DequeState, value: number): DequeFrame[] {
  const operation = "push front"

  if (isDequeFull(state)) {
    return buildFrames(state, [
      {
        state,
        operation,
        phase: "overflow",
        detail: `Capacity ${state.capacity} is full; cannot push ${value} to the front.`,
        complexity: constantTime("A failed push checks the capacity and stops."),
        highlights: [{ target: "slot", id: dequeSlotId(0), role: "active" }],
        feedback: "error",
      },
    ])
  }

  const item: DequeItem = { id: itemId(state.nextItemId), value }
  const nextState: DequeState = {
    ...state,
    items: [item, ...state.items],
    nextItemId: state.nextItemId + 1,
  }

  return buildFrames(state, [
    {
      state: nextState,
      operation,
      phase: "write",
      detail: `Push ${value} to the front at index 0.`,
      complexity: constantTime("Push front adds one item at the front of the deque."),
      highlights: [
        { target: "item", id: item.id, role: "insert" },
        { target: "slot", id: dequeSlotId(0), role: "insert" },
      ],
      feedback: "neutral",
    },
    {
      state: nextState,
      operation,
      phase: "complete",
      detail: `Pushed ${value} to the front; front is index 0, back is index ${nextState.items.length - 1}, size ${nextState.items.length} of ${nextState.capacity}.`,
      complexity: constantTime("Push front adds one item at the front of the deque."),
      highlights: [{ target: "item", id: item.id, role: "active" }],
      feedback: "success",
    },
  ])
}

export function pushBackDeque(state: DequeState, value: number): DequeFrame[] {
  const operation = "push back"

  if (isDequeFull(state)) {
    return buildFrames(state, [
      {
        state,
        operation,
        phase: "overflow",
        detail: `Capacity ${state.capacity} is full; cannot push ${value} to the back.`,
        complexity: constantTime("A failed push checks the capacity and stops."),
        highlights: [{ target: "slot", id: dequeSlotId(state.capacity - 1), role: "active" }],
        feedback: "error",
      },
    ])
  }

  const index = state.items.length
  const item: DequeItem = { id: itemId(state.nextItemId), value }
  const nextState: DequeState = {
    ...state,
    items: [...state.items, item],
    nextItemId: state.nextItemId + 1,
  }

  return buildFrames(state, [
    {
      state: nextState,
      operation,
      phase: "write",
      detail: `Push ${value} to the back at index ${index}.`,
      complexity: constantTime("Push back appends one item at the back of the deque."),
      highlights: [
        { target: "item", id: item.id, role: "insert" },
        { target: "slot", id: dequeSlotId(index), role: "insert" },
      ],
      feedback: "neutral",
    },
    {
      state: nextState,
      operation,
      phase: "complete",
      detail: `Pushed ${value} to the back; front is index 0, back is index ${index}, size ${nextState.items.length} of ${nextState.capacity}.`,
      complexity: constantTime("Push back appends one item at the back of the deque."),
      highlights: [{ target: "item", id: item.id, role: "active" }],
      feedback: "success",
    },
  ])
}

export function popFrontDeque(state: DequeState): DequeFrame[] {
  const operation = "pop front"

  if (isDequeEmpty(state)) {
    return buildFrames(state, [
      {
        state,
        operation,
        phase: "underflow",
        detail: "Cannot pop from the front of an empty deque.",
        complexity: constantTime("A failed pop checks the size and stops."),
        feedback: "error",
      },
    ])
  }

  const item = state.items[0]
  const nextState: DequeState = { ...state, items: state.items.slice(1) }
  const newFront = nextState.items[0]

  return buildFrames(state, [
    {
      state,
      operation,
      phase: "read",
      detail: `Read the front item at index 0: ${item.value}.`,
      complexity: constantTime("Pop front removes the front item in constant time."),
      highlights: [
        { target: "item", id: item.id, role: "remove" },
        { target: "slot", id: dequeSlotId(0), role: "remove" },
      ],
      feedback: "neutral",
    },
    {
      state: nextState,
      operation,
      phase: "remove",
      detail: newFront
        ? `Popped ${item.value} from the front; front is index 0, back is index ${nextState.items.length - 1}, size ${nextState.items.length} of ${nextState.capacity}.`
        : `Popped ${item.value} from the front; the deque is empty.`,
      complexity: constantTime("Pop front removes the front item in constant time."),
      highlights: newFront ? [{ target: "item", id: newFront.id, role: "active" }] : [],
      feedback: "success",
    },
  ])
}

export function popBackDeque(state: DequeState): DequeFrame[] {
  const operation = "pop back"

  if (isDequeEmpty(state)) {
    return buildFrames(state, [
      {
        state,
        operation,
        phase: "underflow",
        detail: "Cannot pop from the back of an empty deque.",
        complexity: constantTime("A failed pop checks the size and stops."),
        feedback: "error",
      },
    ])
  }

  const lastIndex = state.items.length - 1
  const item = state.items[lastIndex]
  const nextState: DequeState = { ...state, items: state.items.slice(0, -1) }
  const newBack = nextState.items[nextState.items.length - 1]

  return buildFrames(state, [
    {
      state,
      operation,
      phase: "read",
      detail: `Read the back item at index ${lastIndex}: ${item.value}.`,
      complexity: constantTime("Pop back removes the back item in constant time."),
      highlights: [
        { target: "item", id: item.id, role: "remove" },
        { target: "slot", id: dequeSlotId(lastIndex), role: "remove" },
      ],
      feedback: "neutral",
    },
    {
      state: nextState,
      operation,
      phase: "remove",
      detail: newBack
        ? `Popped ${item.value} from the back; front is index 0, back is index ${nextState.items.length - 1}, size ${nextState.items.length} of ${nextState.capacity}.`
        : `Popped ${item.value} from the back; the deque is empty.`,
      complexity: constantTime("Pop back removes the back item in constant time."),
      highlights: newBack ? [{ target: "item", id: newBack.id, role: "active" }] : [],
      feedback: "success",
    },
  ])
}

export function peekFrontDeque(state: DequeState): DequeFrame[] {
  const operation = "peek front"

  if (isDequeEmpty(state)) {
    return buildFrames(state, [
      {
        state,
        operation,
        phase: "underflow",
        detail: "Cannot peek the front of an empty deque.",
        complexity: constantTime("Peek front checks the size and reads the front item."),
        feedback: "error",
      },
    ])
  }

  const item = state.items[0]

  return buildFrames(state, [
    {
      state,
      operation,
      phase: "peek",
      detail: `Front is index 0: ${item.value}.`,
      complexity: constantTime("Peek front reads the front item without removing it."),
      highlights: [
        { target: "item", id: item.id, role: "active" },
        { target: "slot", id: dequeSlotId(0), role: "active" },
      ],
      feedback: "success",
    },
  ])
}

export function peekBackDeque(state: DequeState): DequeFrame[] {
  const operation = "peek back"

  if (isDequeEmpty(state)) {
    return buildFrames(state, [
      {
        state,
        operation,
        phase: "underflow",
        detail: "Cannot peek the back of an empty deque.",
        complexity: constantTime("Peek back checks the size and reads the back item."),
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
      detail: `Back is index ${index}: ${item.value}.`,
      complexity: constantTime("Peek back reads the back item without removing it."),
      highlights: [
        { target: "item", id: item.id, role: "active" },
        { target: "slot", id: dequeSlotId(index), role: "active" },
      ],
      feedback: "success",
    },
  ])
}

export function clearDeque(state: DequeState): DequeFrame[] {
  const operation = "clear"

  if (isDequeEmpty(state)) {
    return buildFrames(state, [
      {
        state,
        operation,
        phase: "noop",
        detail: "The deque is already empty.",
        complexity: constantTime("Clearing checks the size before releasing slots."),
        feedback: "warning",
      },
    ])
  }

  const nextState: DequeState = { ...state, items: [] }

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
      detail: `Cleared the deque; capacity ${nextState.capacity} is unchanged.`,
      complexity: linearTime("Clearing releases every occupied slot."),
      feedback: "success",
    },
  ])
}

export const dequeEngine = {
  createState: createDequeState,
  pushFront: pushFrontDeque,
  pushBack: pushBackDeque,
  popFront: popFrontDeque,
  popBack: popBackDeque,
  peekFront: peekFrontDeque,
  peekBack: peekBackDeque,
  clear: clearDeque,
} as const
