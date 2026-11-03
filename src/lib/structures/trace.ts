import type { Trace, TraceFrame } from "./types"

/**
 * Creates a trace with the cursor at the first frame. An empty trace uses
 * `cursor: -1` so step-forward can enter the first frame.
 */
export function createTrace<S>(frames: readonly TraceFrame<S>[] = []): Trace<S> {
  const nextFrames = [...frames]

  return {
    frames: nextFrames,
    cursor: nextFrames.length > 0 ? 0 : -1,
  }
}

export function currentTraceFrame<S>(trace: Trace<S>): TraceFrame<S> | null {
  return trace.frames[trace.cursor] ?? null
}

export function canStepTraceForward<S>(trace: Trace<S>): boolean {
  return trace.cursor < trace.frames.length - 1
}

export function canStepTraceBack<S>(trace: Trace<S>): boolean {
  return trace.cursor > 0
}

export function stepTraceForward<S>(trace: Trace<S>): Trace<S> {
  if (!canStepTraceForward(trace)) {
    return trace
  }

  return { ...trace, cursor: trace.cursor + 1 }
}

export function stepTraceBack<S>(trace: Trace<S>): Trace<S> {
  if (!canStepTraceBack(trace)) {
    return trace
  }

  return { ...trace, cursor: trace.cursor - 1 }
}

/**
 * Appends frames after the current cursor. Any frames after the cursor are
 * discarded first, so running an operation from history branches the trace.
 * The cursor lands on the first appended frame.
 */
export function appendTraceFrames<S>(trace: Trace<S>, frames: readonly TraceFrame<S>[]): Trace<S> {
  if (frames.length === 0) {
    return trace
  }

  const retainedFrames = trace.cursor >= 0 ? trace.frames.slice(0, trace.cursor + 1) : []
  const nextFrames = [...retainedFrames, ...frames]

  return {
    frames: nextFrames,
    cursor: retainedFrames.length,
  }
}

export function resetTrace<S>(trace: Trace<S>): Trace<S> {
  if (trace.frames.length === 0) {
    return trace.cursor === -1 ? trace : { ...trace, cursor: -1 }
  }

  return trace.cursor === 0 ? trace : { ...trace, cursor: 0 }
}

export function selectTraceFrame<S>(trace: Trace<S>, frameIndex: number): Trace<S> {
  if (trace.frames.length === 0 || !Number.isFinite(frameIndex)) {
    return trace
  }

  const nextCursor = Math.min(Math.max(Math.trunc(frameIndex), 0), trace.frames.length - 1)

  return nextCursor === trace.cursor ? trace : { ...trace, cursor: nextCursor }
}
