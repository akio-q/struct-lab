export const STRUCTURE_IDS = ["array", "stack", "queue", "deque", "linked-list"] as const

export type StructureId = (typeof STRUCTURE_IDS)[number]

export type ComplexityClass = "O(1)" | "O(n)"

export type PlaybackStatus = "idle" | "playing" | "paused"

export type Speed = 0.5 | 1 | 1.5 | 2

export type Feedback = "neutral" | "success" | "warning" | "error"

export type HighlightTarget = "item" | "slot" | "node" | "edge" | "pointer"

export type HighlightRole = "active" | "source" | "target" | "insert" | "remove" | "pointer"

export interface Complexity {
  time: ComplexityClass
  space: ComplexityClass
  note: string
}

export interface Highlight {
  target: HighlightTarget
  id: string
  role: HighlightRole
}

export interface StepLogEntry {
  id: string
  operation: string
  phase: string
  detail: string
  feedback: Feedback
}

export type PointerTone = "default" | "pointer" | "success" | "danger"

export interface PointerEntry {
  label: string
  value: string | number | null
  tone?: PointerTone
}

export interface TraceFrame<S> extends StepLogEntry {
  state: S
  complexity: Complexity
  highlights: Highlight[]
}

export interface Trace<S> {
  frames: TraceFrame<S>[]
  cursor: number
}
