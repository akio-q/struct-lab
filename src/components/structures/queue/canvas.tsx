"use client"

import { memo } from "react"
import { AnimatePresence, m, useReducedMotion, type Transition } from "framer-motion"
import { ChevronDown, ChevronUp } from "lucide-react"
import {
  isQueueEmpty,
  isQueueFull,
  queueHeadIndex,
  queueHeadItem,
  queueSlotId,
  queueTailIndex,
  queueTailItem,
  type QueueState,
} from "@/components/structures/queue/engine"
import { highlightRoleMeta, resolveSlotRoles } from "@/components/structures/shared/highlight-roles"
import type { Feedback, Highlight } from "@/lib/structures/types"
import { cn } from "@/lib/utils"

export interface QueueCanvasProps {
  state: QueueState
  highlights?: readonly Highlight[]
  feedback?: Feedback
  className?: string
}

const SLOT_SIZE_REM = 3.5
const TAG_ROW_REM = 1.5
const INDEX_ROW_REM = 1.25

function describeQueue(state: QueueState): string {
  const head = queueHeadItem(state)
  const tail = queueTailItem(state)

  if (!head || !tail) {
    return `Empty queue with capacity ${state.capacity}.`
  }

  const values = state.items.map((item) => item.value).join(", ")

  return `Queue with ${state.items.length} of ${state.capacity} slots used; head is ${head.value} at index 0, tail is ${tail.value} at index ${state.items.length - 1}. Values from head to tail: ${values}.`
}

export const QueueCanvas = memo(function QueueCanvas({
  state,
  highlights = [],
  feedback = "neutral",
  className,
}: QueueCanvasProps) {
  const reduceMotion = useReducedMotion()
  const roles = resolveSlotRoles(state, highlights, queueSlotId)
  const headIndex = queueHeadIndex(state)
  const tailIndex = queueTailIndex(state)
  const isEmpty = isQueueEmpty(state)
  const isFull = isQueueFull(state)
  const status = isEmpty ? "empty" : isFull ? "full" : "open"

  const itemTransition: Transition = reduceMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 420, damping: 32, mass: 0.6 }

  const tagTransition: Transition = reduceMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 320, damping: 30, mass: 0.6 }

  const hint = isEmpty
    ? "Empty queue — enqueue an item to start the line."
    : isFull
      ? "Full queue — enqueue overflows."
      : "Enqueue at the tail; dequeue from the head."

  return (
    <div
      data-testid="queue-canvas"
      className={cn(
        "min-w-0 overflow-hidden rounded-xl border border-border/70 bg-background/30",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
            Capacity
          </span>
          <span
            data-testid="queue-capacity"
            className="font-mono text-xs font-medium text-foreground tabular-nums"
          >
            {state.capacity}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            data-testid="queue-status"
            className={cn(
              "inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[10px] tracking-wide uppercase",
              isEmpty
                ? "border-border/70 bg-white/[0.03] text-muted-foreground"
                : isFull
                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                  : "border-success/25 bg-success/10 text-success",
            )}
          >
            {status}
          </span>
          <span
            data-testid="queue-size"
            className="font-mono text-[10px] text-muted-foreground tabular-nums"
          >
            size {state.items.length} / {state.capacity}
          </span>
        </div>
      </div>

      <div className="p-3">
        <div
          data-testid="queue-conveyor"
          data-feedback={feedback}
          className={cn(
            "rounded-xl border p-3 transition-[border-color,background-color] duration-150",
            feedback === "error"
              ? "border-destructive/50 bg-destructive/[0.03]"
              : "border-border/60 bg-background/20",
          )}
        >
          <div
            role="region"
            aria-label="Queue conveyor"
            tabIndex={0}
            className="overflow-x-auto overscroll-x-contain rounded-lg focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none"
          >
            <div
              role="img"
              aria-label={describeQueue(state)}
              className="mx-auto grid w-max gap-x-2 gap-y-1.5"
              style={{
                gridTemplateColumns: `repeat(${state.capacity}, ${SLOT_SIZE_REM}rem)`,
                gridTemplateRows: `${TAG_ROW_REM}rem ${SLOT_SIZE_REM}rem ${TAG_ROW_REM}rem ${INDEX_ROW_REM}rem`,
              }}
            >
              {isEmpty ? null : (
                <m.div
                  key="tail"
                  data-testid="queue-tail"
                  data-tail-index={tailIndex}
                  layout={!reduceMotion}
                  transition={tagTransition}
                  aria-hidden="true"
                  className="flex items-end justify-center"
                  style={{ gridColumn: tailIndex + 1, gridRow: 1 }}
                >
                  <span className="inline-flex items-center gap-1 rounded-md border border-pointer/30 bg-pointer/10 px-1.5 py-0.5 font-mono text-[10px] leading-none tracking-wide text-pointer uppercase">
                    <ChevronDown className="size-3" />
                    tail
                  </span>
                </m.div>
              )}

              {Array.from({ length: state.capacity }, (_, index) => {
                const item = state.items[index]
                const role = roles.get(index)

                return (
                  <div
                    key={`slot-${index}`}
                    data-testid={`queue-slot-${index}`}
                    data-highlight={role}
                    data-empty={item ? "false" : "true"}
                    className={cn(
                      "relative flex items-center justify-center overflow-hidden rounded-lg border transition-[background-color,border-color,box-shadow] duration-150",
                      item
                        ? "border-border bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                        : "border-dashed border-border/60 bg-background/20",
                      role ? highlightRoleMeta[role].slotClassName : null,
                    )}
                    style={{ gridColumn: index + 1, gridRow: 2, height: `${SLOT_SIZE_REM}rem` }}
                  >
                    {role ? (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute top-1 left-1.5 font-mono text-[8px] leading-none tracking-[0.08em] uppercase",
                          highlightRoleMeta[role].textClassName,
                        )}
                      >
                        {highlightRoleMeta[role].label}
                      </span>
                    ) : null}

                    {item ? null : (
                      <span aria-hidden="true" className="size-1 rounded-full bg-white/[0.08]" />
                    )}
                  </div>
                )
              })}

              <AnimatePresence initial={false}>
                {state.items.map((item, index) => (
                  <m.div
                    key={item.id}
                    data-testid={`queue-item-${item.id}`}
                    data-highlight={roles.get(index)}
                    layout={!reduceMotion}
                    initial={reduceMotion ? false : { opacity: 0, x: 24, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0, x: -24, scale: 0.9 }}
                    transition={itemTransition}
                    className="pointer-events-none z-10 flex items-center justify-center"
                    style={{ gridColumn: index + 1, gridRow: 2 }}
                  >
                    <span
                      className="max-w-full truncate px-1 text-center font-mono text-sm font-medium text-foreground tabular-nums"
                      title={String(item.value)}
                    >
                      {item.value}
                    </span>
                  </m.div>
                ))}
              </AnimatePresence>

              {isEmpty ? null : (
                <div
                  data-testid="queue-head"
                  data-head-index={headIndex}
                  aria-hidden="true"
                  className="flex items-start justify-center"
                  style={{ gridColumn: headIndex + 1, gridRow: 3 }}
                >
                  <span className="inline-flex items-center gap-1 rounded-md border border-pointer/30 bg-pointer/10 px-1.5 py-0.5 font-mono text-[10px] leading-none tracking-wide text-pointer uppercase">
                    <ChevronUp className="size-3" />
                    head
                  </span>
                </div>
              )}

              {Array.from({ length: state.capacity }, (_, index) => (
                <span
                  key={`index-${index}`}
                  data-testid={`queue-index-${index}`}
                  className="flex items-center justify-center font-mono text-[10px] leading-none text-muted-foreground tabular-nums"
                  style={{ gridColumn: index + 1, gridRow: 4 }}
                >
                  {index}
                </span>
              ))}
            </div>
          </div>
        </div>

        <p
          data-testid="queue-hint"
          className="mt-2 text-center text-[11px] text-pretty text-muted-foreground"
        >
          {hint}
        </p>
      </div>
    </div>
  )
})
