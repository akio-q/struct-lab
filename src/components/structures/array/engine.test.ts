import { describe, expect, it } from "vitest"
import {
  accessArray,
  appendArray,
  arraySlotId,
  clearArray,
  createArrayState,
  insertArray,
  isArrayEmpty,
  isArrayFull,
  popArray,
  removeArray,
  setArrayMode,
  type ArrayFrame,
  type ArrayState,
} from "@/components/structures/array/engine"

function values(state: ArrayState): number[] {
  return state.items.map((item) => item.value)
}

function lastFrame(frames: readonly ArrayFrame[]): ArrayFrame {
  return frames[frames.length - 1]
}

describe("createArrayState", () => {
  it("creates an empty dynamic array with the default capacity", () => {
    const state = createArrayState()

    expect(state.mode).toBe("dynamic")
    expect(state.capacity).toBe(4)
    expect(state.items).toEqual([])
    expect(state.nextItemId).toBe(0)
    expect(state.nextFrameId).toBe(0)
  })

  it("creates an empty static array with the default capacity", () => {
    const state = createArrayState({ mode: "static" })

    expect(state.mode).toBe("static")
    expect(state.capacity).toBe(8)
  })

  it("stores initial values with stable ids", () => {
    const state = createArrayState({ initialValues: [12, 7, 24] })

    expect(values(state)).toEqual([12, 7, 24])
    expect(state.items.map((item) => item.id)).toEqual([
      "array-item-0",
      "array-item-1",
      "array-item-2",
    ])
    expect(state.nextItemId).toBe(3)
  })

  it("grows dynamic capacity to fit initial values", () => {
    const five = createArrayState({ initialValues: [1, 2, 3, 4, 5] })
    const nine = createArrayState({ initialValues: Array.from({ length: 9 }, (_, i) => i) })

    expect(five.capacity).toBe(8)
    expect(nine.capacity).toBe(16)
  })

  it("keeps the requested static capacity", () => {
    const state = createArrayState({ mode: "static", capacity: 6, initialValues: [1, 2, 3] })

    expect(state.capacity).toBe(6)
  })

  it("rejects initial values that exceed a static capacity", () => {
    expect(() =>
      createArrayState({ mode: "static", capacity: 2, initialValues: [1, 2, 3] }),
    ).toThrow(RangeError)
  })

  it("normalizes invalid capacities", () => {
    expect(createArrayState({ capacity: 0 }).capacity).toBe(1)
    expect(createArrayState({ capacity: -3 }).capacity).toBe(1)
    expect(createArrayState({ capacity: Number.NaN }).capacity).toBe(1)
    expect(createArrayState({ capacity: 3.9 }).capacity).toBe(3)
  })

  it("reports empty and full states", () => {
    const empty = createArrayState()
    const full = createArrayState({ capacity: 2, initialValues: [1, 2] })

    expect(isArrayEmpty(empty)).toBe(true)
    expect(isArrayEmpty(full)).toBe(false)
    expect(isArrayFull(empty)).toBe(false)
    expect(isArrayFull(full)).toBe(true)
  })

  it("exposes stable slot ids for highlights", () => {
    expect(arraySlotId(3)).toBe("array-slot-3")
  })
})

describe("array trace frames", () => {
  it("uses sequential frame ids and advances the frame counter", () => {
    const initial = createArrayState({ initialValues: [1, 2, 3] })
    const frames = appendArray(initial, 4)

    expect(frames.map((frame) => frame.id)).toEqual(["array-frame-0", "array-frame-1"])
    expect(frames.map((frame) => frame.state.nextFrameId)).toEqual([1, 2])
    expect(new Set(frames.map((frame) => frame.id)).size).toBe(frames.length)
    expect(initial.nextFrameId).toBe(0)
  })

  it("continues frame ids across operations", () => {
    const initial = createArrayState({ initialValues: [1, 2] })
    const first = appendArray(initial, 3)
    const second = appendArray(lastFrame(first).state, 4)

    expect(second.map((frame) => frame.id)).toEqual(["array-frame-2", "array-frame-3"])
  })
})

describe("appendArray", () => {
  it("appends within capacity", () => {
    const initial = createArrayState({ initialValues: [10, 20] })
    const frames = appendArray(initial, 30)
    const finalState = lastFrame(frames).state

    expect(frames.map((frame) => frame.phase)).toEqual(["write", "complete"])
    expect(values(finalState)).toEqual([10, 20, 30])
    expect(finalState.capacity).toBe(4)
    expect(finalState.items[2].id).toBe("array-item-2")
    expect(frames[0].feedback).toBe("neutral")
    expect(frames[1].feedback).toBe("success")
    expect(frames[0].complexity.time).toBe("O(1)")
    expect(frames[0].highlights).toContainEqual({
      target: "item",
      id: finalState.items[2].id,
      role: "insert",
    })
  })

  it("doubles dynamic capacity before appending to a full array", () => {
    const initial = createArrayState({ initialValues: [10, 20, 30, 40] })
    const frames = appendArray(initial, 50)

    expect(frames.map((frame) => frame.phase)).toEqual(["grow", "copy", "write", "complete"])
    expect(frames[0].state.capacity).toBe(4)
    expect(frames[1].state.capacity).toBe(8)
    expect(frames[1].state.items.map((item) => item.id)).toEqual(
      initial.items.map((item) => item.id),
    )
    expect(values(lastFrame(frames).state)).toEqual([10, 20, 30, 40, 50])
    expect(lastFrame(frames).state.capacity).toBe(8)
    expect(frames[0].complexity.time).toBe("O(n)")
    expect(frames[2].complexity.time).toBe("O(1)")
    expect(frames[0].highlights).toEqual(
      initial.items.map((item) => ({ target: "item", id: item.id, role: "source" })),
    )
    expect(frames[1].highlights).toEqual(
      initial.items.map((item) => ({ target: "item", id: item.id, role: "target" })),
    )
  })

  it("reports overflow when a static array is full", () => {
    const initial = createArrayState({ mode: "static", capacity: 2, initialValues: [1, 2] })
    const frames = appendArray(initial, 3)

    expect(frames).toHaveLength(1)
    expect(frames[0].phase).toBe("overflow")
    expect(frames[0].feedback).toBe("error")
    expect(frames[0].complexity.time).toBe("O(1)")
    expect(values(frames[0].state)).toEqual([1, 2])
    expect(frames[0].state.capacity).toBe(2)
  })

  it("appends within a static capacity", () => {
    const initial = createArrayState({ mode: "static", capacity: 3, initialValues: [1] })
    const frames = appendArray(initial, 2)

    expect(frames.map((frame) => frame.phase)).toEqual(["write", "complete"])
    expect(values(lastFrame(frames).state)).toEqual([1, 2])
    expect(lastFrame(frames).state.capacity).toBe(3)
  })

  it("does not reuse item ids after a pop", () => {
    const initial = createArrayState({ initialValues: [1, 2] })
    const popped = popArray(initial)
    const appended = appendArray(lastFrame(popped).state, 3)
    const newItem = lastFrame(appended).state.items[1]

    expect(newItem.id).toBe("array-item-2")
  })
})

describe("popArray", () => {
  it("reports underflow on an empty array", () => {
    const frames = popArray(createArrayState())

    expect(frames).toHaveLength(1)
    expect(frames[0].phase).toBe("underflow")
    expect(frames[0].feedback).toBe("error")
    expect(frames[0].complexity.time).toBe("O(1)")
  })

  it("reads and removes the last item", () => {
    const initial = createArrayState({ initialValues: [1, 2, 3] })
    const frames = popArray(initial)
    const finalState = lastFrame(frames).state

    expect(frames.map((frame) => frame.phase)).toEqual(["read", "remove"])
    expect(frames[0].detail).toContain("items[2] = 3")
    expect(values(finalState)).toEqual([1, 2])
    expect(finalState.capacity).toBe(4)
    expect(frames[0].highlights).toContainEqual({
      target: "item",
      id: initial.items[2].id,
      role: "remove",
    })
    expect(frames[1].feedback).toBe("success")
    expect(frames[0].complexity.time).toBe("O(1)")
  })
})

describe("accessArray", () => {
  it("reads a valid index", () => {
    const initial = createArrayState({ initialValues: [5, 15, 25] })
    const frames = accessArray(initial, 1)

    expect(frames).toHaveLength(1)
    expect(frames[0].phase).toBe("read")
    expect(frames[0].detail).toContain("items[1] = 15")
    expect(frames[0].feedback).toBe("success")
    expect(frames[0].complexity.time).toBe("O(1)")
    expect(frames[0].highlights).toContainEqual({
      target: "item",
      id: initial.items[1].id,
      role: "active",
    })
  })

  it("rejects invalid indices", () => {
    const initial = createArrayState({ initialValues: [5, 15, 25] })

    for (const index of [-1, 3, 1.5, Number.NaN]) {
      const frames = accessArray(initial, index)

      expect(frames).toHaveLength(1)
      expect(frames[0].phase).toBe("bounds")
      expect(frames[0].feedback).toBe("error")
      expect(values(frames[0].state)).toEqual([5, 15, 25])
    }
  })

  it("explains that an empty array has no indices", () => {
    const frames = accessArray(createArrayState(), 0)

    expect(frames[0].detail).toContain("the array is empty")
  })
})

describe("insertArray", () => {
  it("shifts items right and inserts in the middle", () => {
    const initial = createArrayState({ initialValues: [1, 2, 3] })
    const frames = insertArray(initial, 1, 9)
    const finalState = lastFrame(frames).state

    expect(frames.map((frame) => frame.phase)).toEqual(["prepare", "shift", "complete"])
    expect(values(finalState)).toEqual([1, 9, 2, 3])
    expect(finalState.items[1].id).toBe("array-item-3")
    expect(frames[0].detail).toContain("shift 2 items right")
    expect(frames[1].detail).toContain("Shifted 2 items right")
    expect(frames[0].complexity.time).toBe("O(n)")
    expect(frames[2].feedback).toBe("success")
  })

  it("writes at the end without shifting", () => {
    const initial = createArrayState({ initialValues: [1, 2, 3] })
    const frames = insertArray(initial, 3, 4)

    expect(frames.map((frame) => frame.phase)).toEqual(["prepare", "write", "complete"])
    expect(values(lastFrame(frames).state)).toEqual([1, 2, 3, 4])
    expect(frames[1].detail).toContain("Wrote 4 at index 3")
  })

  it("inserts at the start", () => {
    const initial = createArrayState({ initialValues: [2, 3] })
    const frames = insertArray(initial, 0, 1)

    expect(values(lastFrame(frames).state)).toEqual([1, 2, 3])
  })

  it("inserts into an empty array", () => {
    const frames = insertArray(createArrayState(), 0, 7)

    expect(values(lastFrame(frames).state)).toEqual([7])
  })

  it("doubles dynamic capacity before inserting into a full array", () => {
    const initial = createArrayState({ initialValues: [1, 2, 3, 4] })
    const frames = insertArray(initial, 1, 9)
    const finalState = lastFrame(frames).state

    expect(frames.map((frame) => frame.phase)).toEqual([
      "grow",
      "copy",
      "prepare",
      "shift",
      "complete",
    ])
    expect(values(finalState)).toEqual([1, 9, 2, 3, 4])
    expect(finalState.capacity).toBe(8)
    expect(frames[0].complexity.time).toBe("O(n)")
  })

  it("reports overflow when a static array is full", () => {
    const initial = createArrayState({ mode: "static", capacity: 3, initialValues: [1, 2, 3] })
    const frames = insertArray(initial, 1, 9)

    expect(frames).toHaveLength(1)
    expect(frames[0].phase).toBe("overflow")
    expect(frames[0].feedback).toBe("error")
    expect(values(frames[0].state)).toEqual([1, 2, 3])
  })

  it("rejects invalid insertion indices", () => {
    const initial = createArrayState({ initialValues: [1, 2, 3] })

    for (const index of [-1, 4, 1.5, Number.NaN]) {
      const frames = insertArray(initial, index, 9)

      expect(frames).toHaveLength(1)
      expect(frames[0].phase).toBe("bounds")
      expect(frames[0].feedback).toBe("error")
    }
  })
})

describe("removeArray", () => {
  it("shifts items left after removing from the middle", () => {
    const initial = createArrayState({ initialValues: [1, 2, 3, 4] })
    const frames = removeArray(initial, 1)
    const finalState = lastFrame(frames).state

    expect(frames.map((frame) => frame.phase)).toEqual(["read", "shift", "complete"])
    expect(values(finalState)).toEqual([1, 3, 4])
    expect(finalState.capacity).toBe(4)
    expect(frames[0].detail).toContain("items[1] = 2")
    expect(frames[1].detail).toContain("shifted 2 items left")
    expect(frames[2].feedback).toBe("success")
    expect(frames[0].complexity.time).toBe("O(n)")
  })

  it("removes the last item without shifting", () => {
    const initial = createArrayState({ initialValues: [1, 2, 3] })
    const frames = removeArray(initial, 2)

    expect(frames.map((frame) => frame.phase)).toEqual(["read", "remove", "complete"])
    expect(values(lastFrame(frames).state)).toEqual([1, 2])
  })

  it("removes the first item", () => {
    const initial = createArrayState({ initialValues: [1, 2, 3] })
    const frames = removeArray(initial, 0)

    expect(values(lastFrame(frames).state)).toEqual([2, 3])
  })

  it("rejects invalid removal indices", () => {
    const initial = createArrayState({ initialValues: [1, 2, 3] })

    for (const index of [-1, 3, 1.5, Number.NaN]) {
      const frames = removeArray(initial, index)

      expect(frames).toHaveLength(1)
      expect(frames[0].phase).toBe("bounds")
      expect(frames[0].feedback).toBe("error")
    }
  })

  it("rejects removal from an empty array", () => {
    const frames = removeArray(createArrayState(), 0)

    expect(frames[0].phase).toBe("bounds")
    expect(frames[0].detail).toContain("the array is empty")
  })
})

describe("clearArray", () => {
  it("releases every occupied slot and keeps capacity", () => {
    const initial = createArrayState({ initialValues: [1, 2, 3] })
    const frames = clearArray(initial)
    const finalState = lastFrame(frames).state

    expect(frames.map((frame) => frame.phase)).toEqual(["release", "reset"])
    expect(finalState.items).toEqual([])
    expect(finalState.capacity).toBe(4)
    expect(frames[0].highlights).toHaveLength(3)
    expect(frames[1].feedback).toBe("success")
    expect(frames[0].complexity.time).toBe("O(n)")
  })

  it("warns when the array is already empty", () => {
    const frames = clearArray(createArrayState())

    expect(frames).toHaveLength(1)
    expect(frames[0].phase).toBe("noop")
    expect(frames[0].feedback).toBe("warning")
  })
})

describe("setArrayMode", () => {
  it("switches to static mode and keeps the current capacity", () => {
    const initial = createArrayState({ initialValues: [1, 2, 3] })
    const frames = setArrayMode(initial, "static")
    const finalState = lastFrame(frames).state

    expect(finalState.mode).toBe("static")
    expect(finalState.capacity).toBe(4)
    expect(frames[0].feedback).toBe("success")
  })

  it("switches to dynamic mode", () => {
    const initial = createArrayState({ mode: "static", capacity: 6, initialValues: [1, 2] })
    const frames = setArrayMode(initial, "dynamic")

    expect(lastFrame(frames).state.mode).toBe("dynamic")
    expect(lastFrame(frames).state.capacity).toBe(6)
  })

  it("reports a no-op when the mode is unchanged", () => {
    const frames = setArrayMode(createArrayState(), "dynamic")

    expect(frames).toHaveLength(1)
    expect(frames[0].phase).toBe("noop")
    expect(frames[0].feedback).toBe("neutral")
  })

  it("overflows after switching a full dynamic array to static mode", () => {
    const initial = createArrayState({ initialValues: [1, 2, 3, 4] })
    const staticState = lastFrame(setArrayMode(initial, "static")).state
    const frames = appendArray(staticState, 5)

    expect(frames[0].phase).toBe("overflow")
    expect(frames[0].feedback).toBe("error")
  })
})

describe("array immutability", () => {
  it("does not mutate the input state or its item list", () => {
    const initial = createArrayState({ initialValues: [1, 2, 3] })
    const originalItems = initial.items

    appendArray(initial, 4)
    insertArray(initial, 1, 9)
    removeArray(initial, 0)
    clearArray(initial)

    expect(initial.items).toBe(originalItems)
    expect(values(initial)).toEqual([1, 2, 3])
    expect(initial.nextFrameId).toBe(0)
  })
})
