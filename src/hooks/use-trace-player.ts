"use client"

import { useCallback, useEffect, useState } from "react"
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
import type { PlaybackStatus, Speed, Trace, TraceFrame } from "@/lib/structures/types"

const DEFAULT_SPEED: Speed = 1
const DEFAULT_BASE_DELAY_MS = 700

export interface TracePlayerOptions<S> {
  initialFrames?: readonly TraceFrame<S>[]
  initialSpeed?: Speed
  active?: boolean
  autoPlay?: boolean
  baseDelayMs?: number
}

export interface TracePlayer<S> {
  trace: Trace<S>
  frame: TraceFrame<S> | null
  status: PlaybackStatus
  speed: Speed
  isPlaying: boolean
  canStepBack: boolean
  canStepForward: boolean
  play: () => void
  pause: () => void
  togglePlay: () => void
  stepForward: () => void
  stepBack: () => void
  reset: () => void
  selectFrame: (index: number) => void
  appendFrames: (frames: readonly TraceFrame<S>[]) => void
  replaceFrames: (frames: readonly TraceFrame<S>[]) => void
  clear: () => void
  setSpeed: (speed: Speed) => void
}

/**
 * Owns playback for one structure trace. The hook is deliberately headless:
 * engines produce frames, and the hook handles cursor movement, branching,
 * reset, speed, and pausing when its panel becomes inactive.
 */
export function useTracePlayer<S>({
  initialFrames = [],
  initialSpeed = DEFAULT_SPEED,
  active = true,
  autoPlay = true,
  baseDelayMs = DEFAULT_BASE_DELAY_MS,
}: TracePlayerOptions<S> = {}): TracePlayer<S> {
  const [trace, setTrace] = useState<Trace<S>>(() => createTrace(initialFrames))
  const [status, setStatus] = useState<PlaybackStatus>("idle")
  const [speed, setSpeed] = useState<Speed>(initialSpeed)
  const [wasActive, setWasActive] = useState(active)

  // Adjust state during render when the panel deactivates so playback cannot
  // resume silently when the panel becomes active again.
  if (wasActive !== active) {
    setWasActive(active)

    if (!active && status === "playing") {
      setStatus("paused")
    }
  }

  const frame = currentTraceFrame(trace)
  const canStepBack = canStepTraceBack(trace)
  const canStepForward = canStepTraceForward(trace)
  const isPlaying = status === "playing" && active && canStepForward

  const pause = useCallback(() => {
    setStatus((current) => (current === "playing" ? "paused" : current))
  }, [])

  const play = useCallback(() => {
    if (!active || trace.frames.length === 0) {
      return
    }

    const lastFrameIndex = trace.frames.length - 1

    if (trace.cursor >= lastFrameIndex) {
      setTrace((current) => (current.cursor === 0 ? current : { ...current, cursor: 0 }))
    }

    setStatus(lastFrameIndex > 0 ? "playing" : "paused")
  }, [active, trace.cursor, trace.frames.length])

  const togglePlay = useCallback(() => {
    if (status === "playing") {
      pause()
      return
    }

    play()
  }, [pause, play, status])

  const stepForward = useCallback(() => {
    setStatus("paused")
    setTrace((current) => stepTraceForward(current))
  }, [])

  const stepBack = useCallback(() => {
    setStatus("paused")
    setTrace((current) => stepTraceBack(current))
  }, [])

  const reset = useCallback(() => {
    setStatus("idle")
    setTrace((current) => resetTrace(current))
  }, [])

  const selectFrame = useCallback((index: number) => {
    setStatus("paused")
    setTrace((current) => selectTraceFrame(current, index))
  }, [])

  const appendFrames = useCallback(
    (frames: readonly TraceFrame<S>[]) => {
      if (frames.length === 0) {
        return
      }

      setTrace((current) => {
        const nextTrace = appendTraceFrames(current, frames)

        if (autoPlay) {
          return nextTrace
        }

        return { ...nextTrace, cursor: nextTrace.frames.length - 1 }
      })
      setStatus(autoPlay && active && frames.length > 1 ? "playing" : "paused")
    },
    [active, autoPlay],
  )

  const replaceFrames = useCallback((frames: readonly TraceFrame<S>[]) => {
    setStatus("idle")
    setTrace(createTrace(frames))
  }, [])

  const clear = useCallback(() => {
    setStatus("idle")
    setTrace(createTrace())
  }, [])

  useEffect(() => {
    if (!active || status !== "playing") {
      return
    }

    const lastFrameIndex = trace.frames.length - 1

    if (trace.cursor >= lastFrameIndex) {
      return
    }

    const timer = window.setTimeout(() => {
      setTrace((current) => stepTraceForward(current))

      if (trace.cursor + 1 >= lastFrameIndex) {
        setStatus("paused")
      }
    }, baseDelayMs / speed)

    return () => window.clearTimeout(timer)
  }, [active, baseDelayMs, speed, status, trace.cursor, trace.frames.length])

  return {
    trace,
    frame,
    status,
    speed,
    isPlaying,
    canStepBack,
    canStepForward,
    play,
    pause,
    togglePlay,
    stepForward,
    stepBack,
    reset,
    selectFrame,
    appendFrames,
    replaceFrames,
    clear,
    setSpeed,
  }
}
