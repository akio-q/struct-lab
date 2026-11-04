import { describe, expect, it } from "vitest"
import {
  clearDeque,
  createDequeState,
  dequeBackIndex,
  dequeBackItem,
  dequeFrontIndex,
  dequeFrontItem,
  dequeSlotId,
  isDequeEmpty,
  isDequeFull,
  peekBackDeque,
  peekFrontDeque,
  popBackDeque,
  popFrontDeque,
  pushBackDeque,
  pushFrontDeque,
  type DequeFrame,
  type DequeState,
} from "@/components/structures/deque/engine"

function values(state: DequeState): number[] {
  return state.items.map((item) => item.value)
}

function lastFrame(frames: readonly DequeFrame[]): DequeFrame {
  return frames[frames.length - 1]
}

describe("createDequeState", () => {
  it("creates an empty deque with the default capacity", () => {
    const state = createDequeState()

    expect(state.capacity).toBe(6)
    expect(state.items).toEqual([])
    expect(state.nextItemId).toBe(0)
    expect(state.nextFrameId).toBe(0)
  })

  it("seeds initial values with stable item ids", () => {
    const state = createDequeState({ capacity: 4, initialValues: [12, 7, 24] })

    expect(values(state)).toEqual([12, 7, 24])
    expect(state.items.map((item) => item.id)).toEqual([
      "deque-item-0",
      "deque-item-1",
      "deque-item-2",
    ])
    expect(state.nextItemId).toBe(3)
  })

  it("normalizes the requested capacity", () => {
    expect(createDequeState({ capacity: 3.9 }).capacity).toBe(3)
    expect(createDequeState({ capacity: 0 }).capacity).toBe(1)
    expect(createDequeState({ capacity: Number.NaN }).capacity).toBe(1)
  })

  it("rejects initial values that exceed the capacity", () => {
    expect(() => createDequeState({ capacity: 2, initialValues: [1, 2, 3] })).toThrow(RangeError)
  })

  it("reports empty and full states", () => {
    const empty = createDequeState()
    const full = createDequeState({ capacity: 2, initialValues: [1, 2] })

    expect(isDequeEmpty(empty)).toBe(true)
    expect(isDequeEmpty(full)).toBe(false)
    expect(isDequeFull(empty)).toBe(false)
    expect(isDequeFull(full)).toBe(true)
  })

  it("derives the front and back", () => {
    const empty = createDequeState()
    const state = createDequeState({ initialValues: [1, 2, 3] })

    expect(dequeFrontIndex(empty)).toBe(-1)
    expect(dequeBackIndex(empty)).toBe(-1)
    expect(dequeFrontItem(empty)).toBeNull()
    expect(dequeBackItem(empty)).toBeNull()

    expect(dequeFrontIndex(state)).toBe(0)
    expect(dequeBackIndex(state)).toBe(2)
    expect(dequeFrontItem(state)).toBe(state.items[0])
    expect(dequeBackItem(state)).toBe(state.items[2])
  })

  it("exposes stable slot ids for highlights", () => {
    expect(dequeSlotId(3)).toBe("deque-slot-3")
  })
})

describe("deque trace frames", () => {
  it("uses sequential frame ids and advances the frame counter", () => {
    const initial = createDequeState({ initialValues: [1, 2, 3] })
    const frames = pushBackDeque(initial, 4)

    expect(frames.map((frame) => frame.id)).toEqual(["deque-frame-0", "deque-frame-1"])
    expect(frames.map((frame) => frame.state.nextFrameId)).toEqual([1, 2])
    expect(new Set(frames.map((frame) => frame.id)).size).toBe(frames.length)
    expect(initial.nextFrameId).toBe(0)
  })

  it("continues frame ids across operations", () => {
    const initial = createDequeState({ initialValues: [1, 2] })
    const first = pushBackDeque(initial, 3)
    const second = peekFrontDeque(lastFrame(first).state)

    expect(second.map((frame) => frame.id)).toEqual(["deque-frame-2"])
  })
})

describe("pushFrontDeque", () => {
  it("pushes to the front within capacity", () => {
    const initial = createDequeState({ initialValues: [10, 20] })
    const frames = pushFrontDeque(initial, 30)
    const finalState = lastFrame(frames).state

    expect(frames.map((frame) => frame.phase)).toEqual(["write", "complete"])
    expect(values(finalState)).toEqual([30, 10, 20])
    expect(finalState.items[0].id).toBe("deque-item-2")
    expect(finalState.capacity).toBe(6)
    expect(frames[0].feedback).toBe("neutral")
    expect(frames[1].feedback).toBe("success")
    expect(frames[0].complexity.time).toBe("O(1)")
    expect(frames[0].detail).toBe("Push 30 to the front at index 0.")
    expect(frames[1].detail).toContain("front is index 0, back is index 2")
    expect(frames[0].highlights).toContainEqual({
      target: "item",
      id: finalState.items[0].id,
      role: "insert",
    })
    expect(frames[0].highlights).toContainEqual({
      target: "slot",
      id: dequeSlotId(0),
      role: "insert",
    })
    expect(frames[1].highlights).toEqual([
      { target: "item", id: finalState.items[0].id, role: "active" },
    ])
  })

  it("fills the deque to capacity and then reports overflow", () => {
    const initial = createDequeState({ capacity: 2, initialValues: [1] })
    const filled = lastFrame(pushFrontDeque(initial, 2)).state
    const overflow = pushFrontDeque(filled, 3)

    expect(isDequeFull(filled)).toBe(true)
    expect(overflow).toHaveLength(1)
    expect(overflow[0].phase).toBe("overflow")
    expect(overflow[0].feedback).toBe("error")
    expect(overflow[0].complexity.time).toBe("O(1)")
    expect(overflow[0].detail).toContain("cannot push 3 to the front")
    expect(overflow[0].highlights).toEqual([{ target: "slot", id: dequeSlotId(0), role: "active" }])
    expect(values(overflow[0].state)).toEqual([2, 1])
    expect(overflow[0].state.capacity).toBe(2)
  })
})

describe("pushBackDeque", () => {
  it("pushes to the back within capacity", () => {
    const initial = createDequeState({ initialValues: [10, 20] })
    const frames = pushBackDeque(initial, 30)
    const finalState = lastFrame(frames).state

    expect(frames.map((frame) => frame.phase)).toEqual(["write", "complete"])
    expect(values(finalState)).toEqual([10, 20, 30])
    expect(finalState.items[2].id).toBe("deque-item-2")
    expect(frames[0].detail).toBe("Push 30 to the back at index 2.")
    expect(frames[1].detail).toContain("back is index 2")
    expect(frames[0].highlights).toContainEqual({
      target: "slot",
      id: dequeSlotId(2),
      role: "insert",
    })
  })

  it("reports overflow when the deque is full", () => {
    const initial = createDequeState({ capacity: 2, initialValues: [1, 2] })
    const overflow = pushBackDeque(initial, 3)

    expect(overflow).toHaveLength(1)
    expect(overflow[0].phase).toBe("overflow")
    expect(overflow[0].feedback).toBe("error")
    expect(overflow[0].detail).toContain("cannot push 3 to the back")
    expect(overflow[0].highlights).toEqual([{ target: "slot", id: dequeSlotId(1), role: "active" }])
    expect(values(overflow[0].state)).toEqual([1, 2])
  })

  it("does not reuse item ids after a pop", () => {
    const initial = createDequeState({ initialValues: [1, 2] })
    const popped = popFrontDeque(initial)
    const pushed = pushBackDeque(lastFrame(popped).state, 3)
    const newItem = lastFrame(pushed).state.items[1]

    expect(newItem.id).toBe("deque-item-2")
  })
})

describe("popFrontDeque", () => {
  it("reports underflow on an empty deque", () => {
    const frames = popFrontDeque(createDequeState())

    expect(frames).toHaveLength(1)
    expect(frames[0].phase).toBe("underflow")
    expect(frames[0].feedback).toBe("error")
    expect(frames[0].complexity.time).toBe("O(1)")
    expect(frames[0].detail).toBe("Cannot pop from the front of an empty deque.")
  })

  it("reads and removes the front item", () => {
    const initial = createDequeState({ initialValues: [1, 2, 3] })
    const frames = popFrontDeque(initial)
    const finalState = lastFrame(frames).state

    expect(frames.map((frame) => frame.phase)).toEqual(["read", "remove"])
    expect(frames[0].detail).toBe("Read the front item at index 0: 1.")
    expect(values(finalState)).toEqual([2, 3])
    expect(finalState.capacity).toBe(6)
    expect(dequeFrontItem(finalState)?.value).toBe(2)
    expect(dequeBackItem(finalState)?.value).toBe(3)
    expect(frames[0].highlights).toContainEqual({
      target: "item",
      id: initial.items[0].id,
      role: "remove",
    })
    expect(frames[0].highlights).toContainEqual({
      target: "slot",
      id: dequeSlotId(0),
      role: "remove",
    })
    expect(frames[1].feedback).toBe("success")
    expect(frames[1].detail).toBe(
      "Popped 1 from the front; front is index 0, back is index 1, size 2 of 6.",
    )
    expect(frames[1].highlights).toEqual([
      { target: "item", id: initial.items[1].id, role: "active" },
    ])
  })

  it("leaves the deque empty after popping the last item", () => {
    const initial = createDequeState({ initialValues: [7] })
    const frames = popFrontDeque(initial)

    expect(isDequeEmpty(lastFrame(frames).state)).toBe(true)
    expect(lastFrame(frames).detail).toContain("the deque is empty")
    expect(lastFrame(frames).highlights).toEqual([])
  })
})

describe("popBackDeque", () => {
  it("reports underflow on an empty deque", () => {
    const frames = popBackDeque(createDequeState())

    expect(frames).toHaveLength(1)
    expect(frames[0].phase).toBe("underflow")
    expect(frames[0].feedback).toBe("error")
    expect(frames[0].detail).toBe("Cannot pop from the back of an empty deque.")
  })

  it("reads and removes the back item", () => {
    const initial = createDequeState({ initialValues: [1, 2, 3] })
    const frames = popBackDeque(initial)
    const finalState = lastFrame(frames).state

    expect(frames.map((frame) => frame.phase)).toEqual(["read", "remove"])
    expect(frames[0].detail).toBe("Read the back item at index 2: 3.")
    expect(values(finalState)).toEqual([1, 2])
    expect(dequeBackItem(finalState)?.value).toBe(2)
    expect(frames[0].highlights).toContainEqual({
      target: "item",
      id: initial.items[2].id,
      role: "remove",
    })
    expect(frames[0].highlights).toContainEqual({
      target: "slot",
      id: dequeSlotId(2),
      role: "remove",
    })
    expect(frames[1].detail).toBe(
      "Popped 3 from the back; front is index 0, back is index 1, size 2 of 6.",
    )
    expect(frames[1].highlights).toEqual([
      { target: "item", id: initial.items[1].id, role: "active" },
    ])
  })

  it("leaves the deque empty after popping the last item", () => {
    const initial = createDequeState({ initialValues: [7] })
    const frames = popBackDeque(initial)

    expect(isDequeEmpty(lastFrame(frames).state)).toBe(true)
    expect(lastFrame(frames).detail).toContain("the deque is empty")
    expect(lastFrame(frames).highlights).toEqual([])
  })
})

describe("peekFrontDeque", () => {
  it("reads the front item without removing it", () => {
    const initial = createDequeState({ initialValues: [5, 15, 25] })
    const frames = peekFrontDeque(initial)

    expect(frames).toHaveLength(1)
    expect(frames[0].phase).toBe("peek")
    expect(frames[0].detail).toBe("Front is index 0: 5.")
    expect(frames[0].feedback).toBe("success")
    expect(frames[0].complexity.time).toBe("O(1)")
    expect(frames[0].highlights).toContainEqual({
      target: "item",
      id: initial.items[0].id,
      role: "active",
    })
    expect(frames[0].highlights).toContainEqual({
      target: "slot",
      id: dequeSlotId(0),
      role: "active",
    })
    expect(values(frames[0].state)).toEqual([5, 15, 25])
  })

  it("reports underflow on an empty deque", () => {
    const frames = peekFrontDeque(createDequeState())

    expect(frames).toHaveLength(1)
    expect(frames[0].phase).toBe("underflow")
    expect(frames[0].feedback).toBe("error")
    expect(frames[0].detail).toBe("Cannot peek the front of an empty deque.")
  })
})

describe("peekBackDeque", () => {
  it("reads the back item without removing it", () => {
    const initial = createDequeState({ initialValues: [5, 15, 25] })
    const frames = peekBackDeque(initial)

    expect(frames).toHaveLength(1)
    expect(frames[0].phase).toBe("peek")
    expect(frames[0].detail).toBe("Back is index 2: 25.")
    expect(frames[0].feedback).toBe("success")
    expect(frames[0].highlights).toContainEqual({
      target: "item",
      id: initial.items[2].id,
      role: "active",
    })
    expect(frames[0].highlights).toContainEqual({
      target: "slot",
      id: dequeSlotId(2),
      role: "active",
    })
    expect(values(frames[0].state)).toEqual([5, 15, 25])
  })

  it("reports underflow on an empty deque", () => {
    const frames = peekBackDeque(createDequeState())

    expect(frames).toHaveLength(1)
    expect(frames[0].phase).toBe("underflow")
    expect(frames[0].feedback).toBe("error")
    expect(frames[0].detail).toBe("Cannot peek the back of an empty deque.")
  })
})

describe("clearDeque", () => {
  it("releases every occupied slot and keeps capacity", () => {
    const initial = createDequeState({ initialValues: [1, 2, 3] })
    const frames = clearDeque(initial)
    const finalState = lastFrame(frames).state

    expect(frames.map((frame) => frame.phase)).toEqual(["release", "reset"])
    expect(finalState.items).toEqual([])
    expect(finalState.capacity).toBe(6)
    expect(frames[0].highlights).toHaveLength(3)
    expect(frames[1].feedback).toBe("success")
    expect(frames[0].complexity.time).toBe("O(n)")
  })

  it("warns when the deque is already empty", () => {
    const frames = clearDeque(createDequeState())

    expect(frames).toHaveLength(1)
    expect(frames[0].phase).toBe("noop")
    expect(frames[0].feedback).toBe("warning")
  })
})

describe("deque immutability", () => {
  it("does not mutate the input state or its item list", () => {
    const initial = createDequeState({ initialValues: [1, 2, 3] })
    const originalItems = initial.items

    pushFrontDeque(initial, 4)
    pushBackDeque(initial, 4)
    popFrontDeque(initial)
    popBackDeque(initial)
    peekFrontDeque(initial)
    peekBackDeque(initial)
    clearDeque(initial)

    expect(initial.items).toBe(originalItems)
    expect(values(initial)).toEqual([1, 2, 3])
    expect(initial.nextFrameId).toBe(0)
  })
})
