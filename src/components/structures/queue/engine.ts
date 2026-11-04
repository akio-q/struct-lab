import { constantTime, linearTime } from "@/lib/structures/complexity"
import type { Complexity, Feedback, Highlight, TraceFrame } from "@/lib/structures/types"

export interface QueueItem {
  id: string
  value: number
}

export interface QueueState {
  capacity: number
  items: readonly QueueItem[]
  nextItemId: number
  nextFrameId: number
}

export type QueueFrame = TraceFrame<QueueState>

export interface QueueEngineOptions {
  capacity?: number
  initialValues?: readonly number[]
}

const DEFAULT_CAPACITY = 6
const MIN_CAPACITY = 1

function itemId(index: number): string {
  return `queue-item-${index}`
}

export function queueSlotId(index: number): string {
  return `queue-slot-${index}`
}

function normalizeCapacity(capacity: number): number {
  if (!Number.isFinite(capacity)) {
    return MIN_CAPACITY
  }

  return Math.max(MIN_CAPACITY, Math.trunc(capacity))
}

export function isQueueEmpty(state: QueueState): boolean {
  return state.items.length === 0
}

export function isQueueFull(state: QueueState): boolean {
  return state.items.length >= state.capacity
}

/** Returns the head index, or `-1` when the queue is empty. */
export function queueHeadIndex(state: QueueState): number {
  return isQueueEmpty(state) ? -1 : 0
}

/** Returns the tail index, or `-1` when the queue is empty. */
export function queueTailIndex(state: QueueState): number {
  return state.items.length - 1
}

/** Returns the head item, or `null` when the queue is empty. */
export function queueHeadItem(state: QueueState): QueueItem | null {
  return state.items[0] ?? null
}

/** Returns the tail item, or `null` when the queue is empty. */
export function queueTailItem(state: QueueState): QueueItem | null {
  return state.items[state.items.length - 1] ?? null
}

/**
 * Creates the initial snapshot for a fixed-capacity queue. A queue overflows
 * instead of growing, so initial values that exceed the capacity are rejected.
 */
export function createQueueState({
  capacity,
  initialValues = [],
}: QueueEngineOptions = {}): QueueState {
  const effectiveCapacity = normalizeCapacity(capacity ?? DEFAULT_CAPACITY)

  if (initialValues.length > effectiveCapacity) {
    throw new RangeError(
      `Queue capacity ${effectiveCapacity} cannot hold ${initialValues.length} initial items.`,
    )
  }

  const items: QueueItem[] = initialValues.map((value, index) => ({
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
  state: QueueState
  operation: string
  phase: string
  detail: string
  complexity: Complexity
  highlights?: readonly Highlight[]
  feedback?: Feedback
}

function buildFrames(initialState: QueueState, specs: readonly FrameSpec[]): QueueFrame[] {
  let nextFrameId = initialState.nextFrameId

  return specs.map((spec) => {
    const id = `queue-frame-${nextFrameId}`
    const state: QueueState = { ...spec.state, nextFrameId: nextFrameId + 1 }
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

export function enqueueQueue(state: QueueState, value: number): QueueFrame[] {
  const operation = "enqueue"

  if (isQueueFull(state)) {
    return buildFrames(state, [
      {
        state,
        operation,
        phase: "overflow",
        detail: `Capacity ${state.capacity} is full; cannot enqueue ${value}.`,
        complexity: constantTime("A failed enqueue checks the capacity and stops."),
        highlights: [{ target: "slot", id: queueSlotId(state.capacity - 1), role: "active" }],
        feedback: "error",
      },
    ])
  }

  const index = state.items.length
  const item: QueueItem = { id: itemId(state.nextItemId), value }
  const nextState: QueueState = {
    ...state,
    items: [...state.items, item],
    nextItemId: state.nextItemId + 1,
  }

  return buildFrames(state, [
    {
      state: nextState,
      operation,
      phase: "write",
      detail: `Enqueue ${value} at index ${index}.`,
      complexity: constantTime("Enqueue appends one item at the tail of the queue."),
      highlights: [
        { target: "item", id: item.id, role: "insert" },
        { target: "slot", id: queueSlotId(index), role: "insert" },
      ],
      feedback: "neutral",
    },
    {
      state: nextState,
      operation,
      phase: "complete",
      detail: `Enqueued ${value}; head is index 0, tail is index ${index}, size ${nextState.items.length} of ${nextState.capacity}.`,
      complexity: constantTime("Enqueue appends one item at the tail of the queue."),
      highlights: [{ target: "item", id: item.id, role: "active" }],
      feedback: "success",
    },
  ])
}

export function dequeueQueue(state: QueueState): QueueFrame[] {
  const operation = "dequeue"

  if (isQueueEmpty(state)) {
    return buildFrames(state, [
      {
        state,
        operation,
        phase: "underflow",
        detail: "Cannot dequeue from an empty queue.",
        complexity: constantTime("A failed dequeue checks the size and stops."),
        feedback: "error",
      },
    ])
  }

  const item = state.items[0]
  const nextState: QueueState = { ...state, items: state.items.slice(1) }
  const newHead = nextState.items[0]

  return buildFrames(state, [
    {
      state,
      operation,
      phase: "read",
      detail: `Read the head item at index 0: ${item.value}.`,
      complexity: constantTime("Dequeue removes the head item in constant time."),
      highlights: [
        { target: "item", id: item.id, role: "remove" },
        { target: "slot", id: queueSlotId(0), role: "remove" },
      ],
      feedback: "neutral",
    },
    {
      state: nextState,
      operation,
      phase: "remove",
      detail: newHead
        ? `Dequeued ${item.value}; head is index 0, tail is index ${nextState.items.length - 1}, size ${nextState.items.length} of ${nextState.capacity}.`
        : `Dequeued ${item.value}; the queue is empty.`,
      complexity: constantTime("Dequeue removes the head item in constant time."),
      highlights: newHead ? [{ target: "item", id: newHead.id, role: "active" }] : [],
      feedback: "success",
    },
  ])
}

export function peekQueue(state: QueueState): QueueFrame[] {
  const operation = "peek"

  if (isQueueEmpty(state)) {
    return buildFrames(state, [
      {
        state,
        operation,
        phase: "underflow",
        detail: "Cannot peek an empty queue.",
        complexity: constantTime("Peek checks the size and reads the head item."),
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
      detail: `Head is index 0: ${item.value}.`,
      complexity: constantTime("Peek reads the head item without removing it."),
      highlights: [
        { target: "item", id: item.id, role: "active" },
        { target: "slot", id: queueSlotId(0), role: "active" },
      ],
      feedback: "success",
    },
  ])
}

export function clearQueue(state: QueueState): QueueFrame[] {
  const operation = "clear"

  if (isQueueEmpty(state)) {
    return buildFrames(state, [
      {
        state,
        operation,
        phase: "noop",
        detail: "The queue is already empty.",
        complexity: constantTime("Clearing checks the size before releasing slots."),
        feedback: "warning",
      },
    ])
  }

  const nextState: QueueState = { ...state, items: [] }

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
      detail: `Cleared the queue; capacity ${nextState.capacity} is unchanged.`,
      complexity: linearTime("Clearing releases every occupied slot."),
      feedback: "success",
    },
  ])
}

export const queueEngine = {
  createState: createQueueState,
  enqueue: enqueueQueue,
  dequeue: dequeueQueue,
  peek: peekQueue,
  clear: clearQueue,
} as const
