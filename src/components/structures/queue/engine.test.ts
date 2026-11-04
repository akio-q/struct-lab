import { describe, expect, it } from "vitest"
import {
  clearQueue,
  createQueueState,
  dequeueQueue,
  enqueueQueue,
  isQueueEmpty,
  isQueueFull,
  peekQueue,
  queueHeadIndex,
  queueHeadItem,
  queueSlotId,
  queueTailIndex,
  queueTailItem,
  type QueueFrame,
  type QueueState,
} from "@/components/structures/queue/engine"

function values(state: QueueState): number[] {
  return state.items.map((item) => item.value)
}

function lastFrame(frames: readonly QueueFrame[]): QueueFrame {
  return frames[frames.length - 1]
}

describe("createQueueState", () => {
  it("creates an empty queue with the default capacity", () => {
    const state = createQueueState()

    expect(state.capacity).toBe(6)
    expect(state.items).toEqual([])
    expect(state.nextItemId).toBe(0)
    expect(state.nextFrameId).toBe(0)
  })

  it("seeds initial values with stable item ids", () => {
    const state = createQueueState({ capacity: 4, initialValues: [12, 7, 24] })

    expect(values(state)).toEqual([12, 7, 24])
    expect(state.items.map((item) => item.id)).toEqual([
      "queue-item-0",
      "queue-item-1",
      "queue-item-2",
    ])
    expect(state.nextItemId).toBe(3)
  })

  it("normalizes the requested capacity", () => {
    expect(createQueueState({ capacity: 3.9 }).capacity).toBe(3)
    expect(createQueueState({ capacity: 0 }).capacity).toBe(1)
    expect(createQueueState({ capacity: Number.NaN }).capacity).toBe(1)
  })

  it("rejects initial values that exceed the capacity", () => {
    expect(() => createQueueState({ capacity: 2, initialValues: [1, 2, 3] })).toThrow(RangeError)
  })

  it("reports empty and full states", () => {
    const empty = createQueueState()
    const full = createQueueState({ capacity: 2, initialValues: [1, 2] })

    expect(isQueueEmpty(empty)).toBe(true)
    expect(isQueueEmpty(full)).toBe(false)
    expect(isQueueFull(empty)).toBe(false)
    expect(isQueueFull(full)).toBe(true)
  })

  it("derives the head and tail", () => {
    const empty = createQueueState()
    const state = createQueueState({ initialValues: [1, 2, 3] })

    expect(queueHeadIndex(empty)).toBe(-1)
    expect(queueTailIndex(empty)).toBe(-1)
    expect(queueHeadItem(empty)).toBeNull()
    expect(queueTailItem(empty)).toBeNull()

    expect(queueHeadIndex(state)).toBe(0)
    expect(queueTailIndex(state)).toBe(2)
    expect(queueHeadItem(state)).toBe(state.items[0])
    expect(queueTailItem(state)).toBe(state.items[2])
  })

  it("exposes stable slot ids for highlights", () => {
    expect(queueSlotId(3)).toBe("queue-slot-3")
  })
})

describe("queue trace frames", () => {
  it("uses sequential frame ids and advances the frame counter", () => {
    const initial = createQueueState({ initialValues: [1, 2, 3] })
    const frames = enqueueQueue(initial, 4)

    expect(frames.map((frame) => frame.id)).toEqual(["queue-frame-0", "queue-frame-1"])
    expect(frames.map((frame) => frame.state.nextFrameId)).toEqual([1, 2])
    expect(new Set(frames.map((frame) => frame.id)).size).toBe(frames.length)
    expect(initial.nextFrameId).toBe(0)
  })

  it("continues frame ids across operations", () => {
    const initial = createQueueState({ initialValues: [1, 2] })
    const first = enqueueQueue(initial, 3)
    const second = peekQueue(lastFrame(first).state)

    expect(second.map((frame) => frame.id)).toEqual(["queue-frame-2"])
  })
})

describe("enqueueQueue", () => {
  it("enqueues at the tail within capacity", () => {
    const initial = createQueueState({ initialValues: [10, 20] })
    const frames = enqueueQueue(initial, 30)
    const finalState = lastFrame(frames).state

    expect(frames.map((frame) => frame.phase)).toEqual(["write", "complete"])
    expect(values(finalState)).toEqual([10, 20, 30])
    expect(finalState.items[2].id).toBe("queue-item-2")
    expect(finalState.capacity).toBe(6)
    expect(frames[0].feedback).toBe("neutral")
    expect(frames[1].feedback).toBe("success")
    expect(frames[0].complexity.time).toBe("O(1)")
    expect(frames[1].detail).toContain("tail is index 2")
    expect(frames[0].highlights).toContainEqual({
      target: "item",
      id: finalState.items[2].id,
      role: "insert",
    })
    expect(frames[0].highlights).toContainEqual({
      target: "slot",
      id: queueSlotId(2),
      role: "insert",
    })
    expect(frames[1].highlights).toEqual([
      { target: "item", id: finalState.items[2].id, role: "active" },
    ])
  })

  it("fills the queue to capacity and then reports overflow", () => {
    const initial = createQueueState({ capacity: 2, initialValues: [1] })
    const filled = lastFrame(enqueueQueue(initial, 2)).state
    const overflow = enqueueQueue(filled, 3)

    expect(isQueueFull(filled)).toBe(true)
    expect(overflow).toHaveLength(1)
    expect(overflow[0].phase).toBe("overflow")
    expect(overflow[0].feedback).toBe("error")
    expect(overflow[0].complexity.time).toBe("O(1)")
    expect(overflow[0].detail).toContain("cannot enqueue 3")
    expect(overflow[0].highlights).toEqual([{ target: "slot", id: queueSlotId(1), role: "active" }])
    expect(values(overflow[0].state)).toEqual([1, 2])
    expect(overflow[0].state.capacity).toBe(2)
  })

  it("does not reuse item ids after a dequeue", () => {
    const initial = createQueueState({ initialValues: [1, 2] })
    const dequeued = dequeueQueue(initial)
    const enqueued = enqueueQueue(lastFrame(dequeued).state, 3)
    const newItem = lastFrame(enqueued).state.items[1]

    expect(newItem.id).toBe("queue-item-2")
  })
})

describe("dequeueQueue", () => {
  it("reports underflow on an empty queue", () => {
    const frames = dequeueQueue(createQueueState())

    expect(frames).toHaveLength(1)
    expect(frames[0].phase).toBe("underflow")
    expect(frames[0].feedback).toBe("error")
    expect(frames[0].complexity.time).toBe("O(1)")
    expect(frames[0].detail).toBe("Cannot dequeue from an empty queue.")
  })

  it("reads and removes the head item", () => {
    const initial = createQueueState({ initialValues: [1, 2, 3] })
    const frames = dequeueQueue(initial)
    const finalState = lastFrame(frames).state

    expect(frames.map((frame) => frame.phase)).toEqual(["read", "remove"])
    expect(frames[0].detail).toContain("index 0: 1")
    expect(values(finalState)).toEqual([2, 3])
    expect(finalState.capacity).toBe(6)
    expect(queueHeadItem(finalState)?.value).toBe(2)
    expect(queueTailItem(finalState)?.value).toBe(3)
    expect(frames[0].highlights).toContainEqual({
      target: "item",
      id: initial.items[0].id,
      role: "remove",
    })
    expect(frames[0].highlights).toContainEqual({
      target: "slot",
      id: queueSlotId(0),
      role: "remove",
    })
    expect(frames[1].feedback).toBe("success")
    expect(frames[1].detail).toContain("head is index 0, tail is index 1")
    expect(frames[1].highlights).toEqual([
      { target: "item", id: initial.items[1].id, role: "active" },
    ])
    expect(frames[0].complexity.time).toBe("O(1)")
  })

  it("leaves the queue empty after dequeuing the last item", () => {
    const initial = createQueueState({ initialValues: [7] })
    const frames = dequeueQueue(initial)

    expect(isQueueEmpty(lastFrame(frames).state)).toBe(true)
    expect(lastFrame(frames).detail).toContain("the queue is empty")
    expect(lastFrame(frames).highlights).toEqual([])
  })
})

describe("peekQueue", () => {
  it("reads the head item without removing it", () => {
    const initial = createQueueState({ initialValues: [5, 15, 25] })
    const frames = peekQueue(initial)

    expect(frames).toHaveLength(1)
    expect(frames[0].phase).toBe("peek")
    expect(frames[0].detail).toContain("index 0: 5")
    expect(frames[0].feedback).toBe("success")
    expect(frames[0].complexity.time).toBe("O(1)")
    expect(frames[0].highlights).toContainEqual({
      target: "item",
      id: initial.items[0].id,
      role: "active",
    })
    expect(frames[0].highlights).toContainEqual({
      target: "slot",
      id: queueSlotId(0),
      role: "active",
    })
    expect(values(frames[0].state)).toEqual([5, 15, 25])
  })

  it("reports underflow on an empty queue", () => {
    const frames = peekQueue(createQueueState())

    expect(frames).toHaveLength(1)
    expect(frames[0].phase).toBe("underflow")
    expect(frames[0].feedback).toBe("error")
    expect(frames[0].detail).toBe("Cannot peek an empty queue.")
  })
})

describe("clearQueue", () => {
  it("releases every occupied slot and keeps capacity", () => {
    const initial = createQueueState({ initialValues: [1, 2, 3] })
    const frames = clearQueue(initial)
    const finalState = lastFrame(frames).state

    expect(frames.map((frame) => frame.phase)).toEqual(["release", "reset"])
    expect(finalState.items).toEqual([])
    expect(finalState.capacity).toBe(6)
    expect(frames[0].highlights).toHaveLength(3)
    expect(frames[1].feedback).toBe("success")
    expect(frames[0].complexity.time).toBe("O(n)")
  })

  it("warns when the queue is already empty", () => {
    const frames = clearQueue(createQueueState())

    expect(frames).toHaveLength(1)
    expect(frames[0].phase).toBe("noop")
    expect(frames[0].feedback).toBe("warning")
  })
})

describe("queue immutability", () => {
  it("does not mutate the input state or its item list", () => {
    const initial = createQueueState({ initialValues: [1, 2, 3] })
    const originalItems = initial.items

    enqueueQueue(initial, 4)
    dequeueQueue(initial)
    peekQueue(initial)
    clearQueue(initial)

    expect(initial.items).toBe(originalItems)
    expect(values(initial)).toEqual([1, 2, 3])
    expect(initial.nextFrameId).toBe(0)
  })
})
