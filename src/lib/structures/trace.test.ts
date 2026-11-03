import { describe, expect, it } from "vitest"
import {
  appendTraceFrames,
  canStepTraceBack,
  canStepTraceForward,
  createTrace,
  currentTraceFrame,
  resetTrace,
  selectTraceFrame,
  stepTraceBack,
  stepTraceForward,
} from "@/lib/structures/trace"
import type { TraceFrame } from "@/lib/structures/types"

function frame(id: string): TraceFrame<string> {
  return {
    id,
    state: id,
    operation: "test",
    phase: id,
    detail: `Frame ${id}`,
    complexity: { time: "O(1)", space: "O(n)", note: "Test frame." },
    highlights: [],
    feedback: "neutral",
  }
}

const frames = [frame("a"), frame("b"), frame("c")]

describe("trace history", () => {
  it("creates an empty trace with a cursor before the first frame", () => {
    const trace = createTrace<string>()

    expect(trace.frames).toEqual([])
    expect(trace.cursor).toBe(-1)
  })

  it("creates a trace at the first frame and copies the input", () => {
    const input = [frame("a")]
    const trace = createTrace(input)

    expect(trace.frames).toEqual(input)
    expect(trace.frames).not.toBe(input)
    expect(trace.cursor).toBe(0)
  })

  it("returns the current frame", () => {
    expect(currentTraceFrame(createTrace(frames))).toEqual(frames[0])
    expect(currentTraceFrame(createTrace<string>())).toBeNull()
  })

  it("steps forward and backward within bounds", () => {
    let trace = createTrace(frames)

    expect(canStepTraceBack(trace)).toBe(false)
    expect(canStepTraceForward(trace)).toBe(true)

    trace = stepTraceForward(trace)
    expect(trace.cursor).toBe(1)
    expect(canStepTraceBack(trace)).toBe(true)

    trace = stepTraceForward(stepTraceForward(trace))
    expect(trace.cursor).toBe(2)
    expect(canStepTraceForward(trace)).toBe(false)

    trace = stepTraceBack(trace)
    expect(trace.cursor).toBe(1)
  })

  it("returns the same trace at the boundaries", () => {
    const start = createTrace(frames)
    const end = { ...start, cursor: 2 }

    expect(stepTraceBack(start)).toBe(start)
    expect(stepTraceForward(end)).toBe(end)
  })

  it("appends frames after the current cursor and truncates the future", () => {
    const trace = selectTraceFrame(createTrace(frames), 1)
    const next = appendTraceFrames(trace, [frame("d"), frame("e")])

    expect(next.frames.map((item) => item.id)).toEqual(["a", "b", "d", "e"])
    expect(next.cursor).toBe(2)
    expect(trace.frames.map((item) => item.id)).toEqual(["a", "b", "c"])
    expect(trace.cursor).toBe(1)
  })

  it("appends to an empty trace and ignores empty appends", () => {
    const empty = createTrace<string>()
    const appended = appendTraceFrames(empty, [frame("a")])

    expect(appended.frames.map((item) => item.id)).toEqual(["a"])
    expect(appended.cursor).toBe(0)
    expect(appendTraceFrames(appended, [])).toBe(appended)
  })

  it("resets the cursor to the first frame", () => {
    const trace = selectTraceFrame(createTrace(frames), 2)

    expect(resetTrace(trace).cursor).toBe(0)
    expect(resetTrace(createTrace<string>()).cursor).toBe(-1)
  })

  it("selects and clamps frame indices", () => {
    const trace = createTrace(frames)

    expect(selectTraceFrame(trace, 1).cursor).toBe(1)
    expect(selectTraceFrame(trace, -5).cursor).toBe(0)
    expect(selectTraceFrame(trace, 99).cursor).toBe(2)
    expect(selectTraceFrame(trace, 1.9).cursor).toBe(1)
    expect(selectTraceFrame(trace, Number.NaN)).toBe(trace)
  })
})
