import type { TraceFrame } from "@/lib/structures/types"

export interface TraceAnnouncerProps {
  frame: TraceFrame<unknown> | null
  cursor: number
  total: number
}

/**
 * Announces the current trace frame to assistive technology without adding
 * visible chrome. Only the active panel's announcer is exposed, because
 * inactive panels are `aria-hidden` and `inert`.
 */
export function TraceAnnouncer({ frame, cursor, total }: TraceAnnouncerProps) {
  const message = frame
    ? `Step ${cursor + 1} of ${total}: ${frame.operation}, ${frame.phase}. ${frame.detail}`
    : ""

  return (
    <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </p>
  )
}
