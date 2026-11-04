import { describe, expect, it } from "vitest"
import {
  clearStack,
  createStackState,
  isStackEmpty,
  isStackFull,
  peekStack,
  popStack,
  pushStack,
  stackSlotId,
  stackTopIndex,
  stackTopItem,
  type StackFrame,
  type StackState,
} from "@/components/structures/stack/engine"

function values(state: StackState): number[] {
  return state.items.map((item) => item.value)
}

function lastFrame(frames: readonly StackFrame[]): StackFrame {
  return frames[frames.length - 1]
}

describe("createStackState", () => {
  it("creates an empty stack with the default capacity", () => {
    const state = createStackState()

    expect(state.capacity).toBe(6)
    expect(state.items).toEqual([])
    expect(state.nextItemId).toBe(0)
    expect(state.nextFrameId).toBe(0)
  })

  it("seeds initial values with stable item ids", () => {
    const state = createStackState({ capacity: 4, initialValues: [12, 7, 24] })

    expect(values(state)).toEqual([12, 7, 24])
    expect(state.items.map((item) => item.id)).toEqual([
      "stack-item-0",
      "stack-item-1",
      "stack-item-2",
    ])
    expect(state.nextItemId).toBe(3)
  })

  it("normalizes the requested capacity", () => {
    expect(createStackState({ capacity: 3.9 }).capacity).toBe(3)
    expect(createStackState({ capacity: 0 }).capacity).toBe(1)
    expect(createStackState({ capacity: Number.NaN }).capacity).toBe(1)
  })

  it("rejects initial values that exceed the capacity", () => {
    expect(() => createStackState({ capacity: 2, initialValues: [1, 2, 3] })).toThrow(RangeError)
  })

  it("reports empty and full states", () => {
    const empty = createStackState()
    const full = createStackState({ capacity: 2, initialValues: [1, 2] })

    expect(isStackEmpty(empty)).toBe(true)
    expect(isStackEmpty(full)).toBe(false)
    expect(isStackFull(empty)).toBe(false)
    expect(isStackFull(full)).toBe(true)
  })

  it("derives the top index and top item", () => {
    const empty = createStackState()
    const state = createStackState({ initialValues: [1, 2, 3] })

    expect(stackTopIndex(empty)).toBe(-1)
    expect(stackTopItem(empty)).toBeNull()
    expect(stackTopIndex(state)).toBe(2)
    expect(stackTopItem(state)).toBe(state.items[2])
  })

  it("exposes stable slot ids for highlights", () => {
    expect(stackSlotId(3)).toBe("stack-slot-3")
  })
})

describe("stack trace frames", () => {
  it("uses sequential frame ids and advances the frame counter", () => {
    const initial = createStackState({ initialValues: [1, 2, 3] })
    const frames = pushStack(initial, 4)

    expect(frames.map((frame) => frame.id)).toEqual(["stack-frame-0", "stack-frame-1"])
    expect(frames.map((frame) => frame.state.nextFrameId)).toEqual([1, 2])
    expect(new Set(frames.map((frame) => frame.id)).size).toBe(frames.length)
    expect(initial.nextFrameId).toBe(0)
  })

  it("continues frame ids across operations", () => {
    const initial = createStackState({ initialValues: [1, 2] })
    const first = pushStack(initial, 3)
    const second = peekStack(lastFrame(first).state)

    expect(second.map((frame) => frame.id)).toEqual(["stack-frame-2"])
  })
})

describe("pushStack", () => {
  it("pushes onto the top within capacity", () => {
    const initial = createStackState({ initialValues: [10, 20] })
    const frames = pushStack(initial, 30)
    const finalState = lastFrame(frames).state

    expect(frames.map((frame) => frame.phase)).toEqual(["write", "complete"])
    expect(values(finalState)).toEqual([10, 20, 30])
    expect(finalState.items[2].id).toBe("stack-item-2")
    expect(finalState.capacity).toBe(6)
    expect(frames[0].feedback).toBe("neutral")
    expect(frames[1].feedback).toBe("success")
    expect(frames[0].complexity.time).toBe("O(1)")
    expect(frames[0].highlights).toContainEqual({
      target: "item",
      id: finalState.items[2].id,
      role: "insert",
    })
    expect(frames[0].highlights).toContainEqual({
      target: "slot",
      id: stackSlotId(2),
      role: "insert",
    })
    expect(frames[1].highlights).toEqual([
      { target: "item", id: finalState.items[2].id, role: "active" },
    ])
  })

  it("fills the stack to capacity and then reports overflow", () => {
    const initial = createStackState({ capacity: 2, initialValues: [1] })
    const filled = lastFrame(pushStack(initial, 2)).state
    const overflow = pushStack(filled, 3)

    expect(isStackFull(filled)).toBe(true)
    expect(overflow).toHaveLength(1)
    expect(overflow[0].phase).toBe("overflow")
    expect(overflow[0].feedback).toBe("error")
    expect(overflow[0].complexity.time).toBe("O(1)")
    expect(overflow[0].detail).toContain("cannot push 3")
    expect(overflow[0].highlights).toEqual([{ target: "slot", id: stackSlotId(1), role: "active" }])
    expect(values(overflow[0].state)).toEqual([1, 2])
    expect(overflow[0].state.capacity).toBe(2)
  })

  it("does not reuse item ids after a pop", () => {
    const initial = createStackState({ initialValues: [1, 2] })
    const popped = popStack(initial)
    const pushed = pushStack(lastFrame(popped).state, 3)
    const newItem = lastFrame(pushed).state.items[1]

    expect(newItem.id).toBe("stack-item-2")
  })
})

describe("popStack", () => {
  it("reports underflow on an empty stack", () => {
    const frames = popStack(createStackState())

    expect(frames).toHaveLength(1)
    expect(frames[0].phase).toBe("underflow")
    expect(frames[0].feedback).toBe("error")
    expect(frames[0].complexity.time).toBe("O(1)")
    expect(frames[0].detail).toBe("Cannot pop from an empty stack.")
  })

  it("reads and removes the top item", () => {
    const initial = createStackState({ initialValues: [1, 2, 3] })
    const frames = popStack(initial)
    const finalState = lastFrame(frames).state

    expect(frames.map((frame) => frame.phase)).toEqual(["read", "remove"])
    expect(frames[0].detail).toContain("index 2: 3")
    expect(values(finalState)).toEqual([1, 2])
    expect(finalState.capacity).toBe(6)
    expect(frames[0].highlights).toContainEqual({
      target: "item",
      id: initial.items[2].id,
      role: "remove",
    })
    expect(frames[1].feedback).toBe("success")
    expect(frames[1].detail).toContain("top is index 1")
    expect(frames[1].highlights).toEqual([
      { target: "item", id: initial.items[1].id, role: "active" },
    ])
    expect(frames[0].complexity.time).toBe("O(1)")
  })

  it("leaves the stack empty after popping the last item", () => {
    const initial = createStackState({ initialValues: [7] })
    const frames = popStack(initial)

    expect(isStackEmpty(lastFrame(frames).state)).toBe(true)
    expect(lastFrame(frames).detail).toContain("the stack is empty")
    expect(lastFrame(frames).highlights).toEqual([])
  })
})

describe("peekStack", () => {
  it("reads the top item without removing it", () => {
    const initial = createStackState({ initialValues: [5, 15, 25] })
    const frames = peekStack(initial)

    expect(frames).toHaveLength(1)
    expect(frames[0].phase).toBe("peek")
    expect(frames[0].detail).toContain("index 2: 25")
    expect(frames[0].feedback).toBe("success")
    expect(frames[0].complexity.time).toBe("O(1)")
    expect(frames[0].highlights).toContainEqual({
      target: "item",
      id: initial.items[2].id,
      role: "active",
    })
    expect(values(frames[0].state)).toEqual([5, 15, 25])
  })

  it("reports underflow on an empty stack", () => {
    const frames = peekStack(createStackState())

    expect(frames).toHaveLength(1)
    expect(frames[0].phase).toBe("underflow")
    expect(frames[0].feedback).toBe("error")
    expect(frames[0].detail).toBe("Cannot peek an empty stack.")
  })
})

describe("clearStack", () => {
  it("releases every occupied slot and keeps capacity", () => {
    const initial = createStackState({ initialValues: [1, 2, 3] })
    const frames = clearStack(initial)
    const finalState = lastFrame(frames).state

    expect(frames.map((frame) => frame.phase)).toEqual(["release", "reset"])
    expect(finalState.items).toEqual([])
    expect(finalState.capacity).toBe(6)
    expect(frames[0].highlights).toHaveLength(3)
    expect(frames[1].feedback).toBe("success")
    expect(frames[0].complexity.time).toBe("O(n)")
  })

  it("warns when the stack is already empty", () => {
    const frames = clearStack(createStackState())

    expect(frames).toHaveLength(1)
    expect(frames[0].phase).toBe("noop")
    expect(frames[0].feedback).toBe("warning")
  })
})

describe("stack immutability", () => {
  it("does not mutate the input state or its item list", () => {
    const initial = createStackState({ initialValues: [1, 2, 3] })
    const originalItems = initial.items

    pushStack(initial, 4)
    popStack(initial)
    peekStack(initial)
    clearStack(initial)

    expect(initial.items).toBe(originalItems)
    expect(values(initial)).toEqual([1, 2, 3])
    expect(initial.nextFrameId).toBe(0)
  })
})
