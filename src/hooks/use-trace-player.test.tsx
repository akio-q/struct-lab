import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useTracePlayer } from "@/hooks/use-trace-player"
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

describe("useTracePlayer", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("starts at the first frame", () => {
    const { result } = renderHook(() => useTracePlayer({ initialFrames: frames, autoPlay: false }))

    expect(result.current.trace.cursor).toBe(0)
    expect(result.current.frame?.id).toBe("a")
    expect(result.current.status).toBe("idle")
    expect(result.current.canStepBack).toBe(false)
    expect(result.current.canStepForward).toBe(true)
  })

  it("steps forward and backward", () => {
    const { result } = renderHook(() => useTracePlayer({ initialFrames: frames, autoPlay: false }))

    act(() => result.current.stepForward())

    expect(result.current.trace.cursor).toBe(1)
    expect(result.current.status).toBe("paused")

    act(() => result.current.stepBack())

    expect(result.current.trace.cursor).toBe(0)
  })

  it("advances through frames while playing", () => {
    const { result } = renderHook(() =>
      useTracePlayer({ initialFrames: frames, autoPlay: false, baseDelayMs: 100 }),
    )

    act(() => result.current.play())

    expect(result.current.status).toBe("playing")

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(result.current.trace.cursor).toBe(1)

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(result.current.trace.cursor).toBe(2)
    expect(result.current.status).toBe("paused")
  })

  it("scales the playback interval with speed", () => {
    const { result } = renderHook(() =>
      useTracePlayer({
        initialFrames: frames,
        autoPlay: false,
        baseDelayMs: 100,
        initialSpeed: 2,
      }),
    )

    act(() => result.current.play())
    act(() => {
      vi.advanceTimersByTime(50)
    })

    expect(result.current.trace.cursor).toBe(1)
  })

  it("pauses without advancing", () => {
    const { result } = renderHook(() =>
      useTracePlayer({ initialFrames: frames, autoPlay: false, baseDelayMs: 100 }),
    )

    act(() => result.current.play())
    act(() => result.current.pause())

    expect(result.current.status).toBe("paused")

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.trace.cursor).toBe(0)
  })

  it("pauses when its panel becomes inactive", () => {
    const { result, rerender } = renderHook(
      ({ active }) =>
        useTracePlayer({ initialFrames: frames, autoPlay: false, baseDelayMs: 100, active }),
      { initialProps: { active: true } },
    )

    act(() => result.current.play())
    rerender({ active: false })

    expect(result.current.status).toBe("paused")
    expect(result.current.isPlaying).toBe(false)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.trace.cursor).toBe(0)
  })

  it("stays paused after its panel becomes active again", () => {
    const { result, rerender } = renderHook(
      ({ active }) =>
        useTracePlayer({ initialFrames: frames, autoPlay: false, baseDelayMs: 100, active }),
      { initialProps: { active: true } },
    )

    act(() => result.current.play())
    rerender({ active: false })
    rerender({ active: true })

    expect(result.current.status).toBe("paused")

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.trace.cursor).toBe(0)
  })

  it("stays paused when the trace has a single frame", () => {
    const { result } = renderHook(() =>
      useTracePlayer({ initialFrames: [frame("only")], autoPlay: false, baseDelayMs: 100 }),
    )

    act(() => result.current.play())

    expect(result.current.status).toBe("paused")
    expect(result.current.isPlaying).toBe(false)
  })

  it("branches from the current frame and appends at the end when paused", () => {
    const { result } = renderHook(() => useTracePlayer({ initialFrames: frames, autoPlay: false }))

    act(() => result.current.selectFrame(1))
    act(() => result.current.appendFrames([frame("d"), frame("e")]))

    expect(result.current.trace.frames.map((item) => item.id)).toEqual(["a", "b", "d", "e"])
    expect(result.current.trace.cursor).toBe(3)
    expect(result.current.status).toBe("paused")
  })

  it("starts playing from the first appended frame", () => {
    const { result } = renderHook(() =>
      useTracePlayer({ initialFrames: frames, autoPlay: true, baseDelayMs: 100 }),
    )

    act(() => result.current.appendFrames([frame("d"), frame("e")]))

    expect(result.current.trace.frames.map((item) => item.id)).toEqual(["a", "d", "e"])
    expect(result.current.trace.cursor).toBe(1)
    expect(result.current.status).toBe("playing")
  })

  it("resets to the first frame", () => {
    const { result } = renderHook(() => useTracePlayer({ initialFrames: frames, autoPlay: false }))

    act(() => result.current.stepForward())
    act(() => result.current.reset())

    expect(result.current.trace.cursor).toBe(0)
    expect(result.current.status).toBe("idle")
  })

  it("restarts from the beginning when playing at the end", () => {
    const { result } = renderHook(() =>
      useTracePlayer({ initialFrames: frames, autoPlay: false, baseDelayMs: 100 }),
    )

    act(() => result.current.selectFrame(2))
    act(() => result.current.play())

    expect(result.current.trace.cursor).toBe(0)
    expect(result.current.status).toBe("playing")
  })

  it("pauses when a frame is selected", () => {
    const { result } = renderHook(() => useTracePlayer({ initialFrames: frames, autoPlay: false }))

    act(() => result.current.play())
    act(() => result.current.selectFrame(2))

    expect(result.current.status).toBe("paused")
    expect(result.current.trace.cursor).toBe(2)
  })

  it("replaces and clears traces", () => {
    const { result } = renderHook(() => useTracePlayer({ initialFrames: frames, autoPlay: false }))

    act(() => result.current.replaceFrames([frame("x")]))

    expect(result.current.trace.frames.map((item) => item.id)).toEqual(["x"])
    expect(result.current.trace.cursor).toBe(0)
    expect(result.current.status).toBe("idle")

    act(() => result.current.clear())

    expect(result.current.trace.frames).toEqual([])
    expect(result.current.trace.cursor).toBe(-1)
    expect(result.current.status).toBe("idle")
  })

  it("updates the playback speed", () => {
    const { result } = renderHook(() => useTracePlayer({ initialFrames: frames, autoPlay: false }))

    act(() => result.current.setSpeed(2))

    expect(result.current.speed).toBe(2)
  })
})
