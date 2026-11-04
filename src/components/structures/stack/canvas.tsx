"use client"

import { AnimatePresence, motion, useReducedMotion, type Transition } from "framer-motion"
import { ChevronLeft } from "lucide-react"
import { highlightRoleMeta, resolveSlotRoles } from "@/components/structures/shared/highlight-roles"
import {
  isStackEmpty,
  isStackFull,
  stackSlotId,
  stackTopIndex,
  stackTopItem,
  type StackState,
} from "@/components/structures/stack/engine"
import type { Feedback, Highlight } from "@/lib/structures/types"
import { cn } from "@/lib/utils"

export interface StackCanvasProps {
  state: StackState
  highlights?: readonly Highlight[]
  feedback?: Feedback
  className?: string
}

const SLOT_HEIGHT_REM = 2.75
const ROW_GAP_REM = 0.375
const ROW_PITCH_REM = SLOT_HEIGHT_REM + ROW_GAP_REM
const BASE_ROW_HEIGHT_REM = 0.5

function describeStack(state: StackState): string {
  const top = stackTopItem(state)

  if (!top) {
    return `Empty stack with capacity ${state.capacity}; top is -1.`
  }

  const values = state.items
    .slice()
    .reverse()
    .map((item) => item.value)
    .join(", ")

  return `Stack with ${state.items.length} of ${state.capacity} slots used; top is ${top.value} at index ${state.items.length - 1}. Values from top to bottom: ${values}.`
}

export function StackCanvas({
  state,
  highlights = [],
  feedback = "neutral",
  className,
}: StackCanvasProps) {
  const reduceMotion = useReducedMotion()
  const roles = resolveSlotRoles(state, highlights, stackSlotId)
  const topIndex = stackTopIndex(state)
  const isEmpty = isStackEmpty(state)
  const isFull = isStackFull(state)
  const status = isEmpty ? "empty" : isFull ? "full" : "open"

  const pointerRow = topIndex >= 0 ? state.capacity - 1 - topIndex : state.capacity
  const pointerY =
    topIndex >= 0
      ? pointerRow * ROW_PITCH_REM
      : pointerRow * ROW_PITCH_REM - (SLOT_HEIGHT_REM - BASE_ROW_HEIGHT_REM) / 2

  const pointerTransition: Transition = reduceMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 320, damping: 30, mass: 0.6 }

  const itemTransition: Transition = reduceMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 420, damping: 32, mass: 0.6 }

  const hint = isEmpty
    ? "Empty stack — pop and peek underflow."
    : isFull
      ? "Full stack — push overflows."
      : "Push adds to the top; pop removes the top."

  return (
    <div
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
            data-testid="stack-capacity"
            className="font-mono text-xs font-medium text-foreground tabular-nums"
          >
            {state.capacity}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            data-testid="stack-status"
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
            data-testid="stack-depth"
            className="font-mono text-[10px] text-muted-foreground tabular-nums"
          >
            depth {state.items.length} / {state.capacity}
          </span>
        </div>
      </div>

      <div className="p-3">
        <div
          data-testid="stack-chamber"
          data-feedback={feedback}
          className={cn(
            "mx-auto w-max rounded-xl border p-3 transition-[border-color,background-color] duration-150",
            feedback === "error"
              ? "border-destructive/50 bg-destructive/[0.03]"
              : "border-border/60 bg-background/20",
          )}
        >
          <div
            role="img"
            aria-label={describeStack(state)}
            className="flex items-start gap-2 pr-16"
          >
            <div aria-hidden="true" className="flex flex-col" style={{ gap: `${ROW_GAP_REM}rem` }}>
              {Array.from({ length: state.capacity }, (_, row) => {
                const index = state.capacity - 1 - row

                return (
                  <span
                    key={index}
                    data-testid={`stack-index-${index}`}
                    className="flex items-center justify-end font-mono text-[10px] text-muted-foreground tabular-nums"
                    style={{ height: `${SLOT_HEIGHT_REM}rem` }}
                  >
                    {index}
                  </span>
                )
              })}
              <span style={{ height: `${BASE_ROW_HEIGHT_REM}rem` }} />
            </div>

            <div className="relative flex flex-col" style={{ gap: `${ROW_GAP_REM}rem` }}>
              {Array.from({ length: state.capacity }, (_, row) => {
                const index = state.capacity - 1 - row
                const item = state.items[index]
                const role = roles.get(index)

                return (
                  <div
                    key={index}
                    data-testid={`stack-slot-${index}`}
                    data-highlight={role}
                    data-empty={item ? "false" : "true"}
                    className={cn(
                      "relative flex w-20 items-center justify-center overflow-hidden rounded-lg border transition-[background-color,border-color,box-shadow] duration-150",
                      item
                        ? "border-border bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                        : "border-dashed border-border/60 bg-background/20",
                      role ? highlightRoleMeta[role].slotClassName : null,
                    )}
                    style={{ height: `${SLOT_HEIGHT_REM}rem` }}
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

                    <AnimatePresence initial={false}>
                      {item ? (
                        <motion.span
                          key={item.id}
                          initial={reduceMotion ? false : { opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={reduceMotion ? undefined : { opacity: 0, y: -14 }}
                          transition={itemTransition}
                          className="max-w-full truncate px-2 text-center font-mono text-sm font-medium text-foreground tabular-nums"
                          title={String(item.value)}
                        >
                          {item.value}
                        </motion.span>
                      ) : null}
                    </AnimatePresence>

                    {item ? null : (
                      <span aria-hidden="true" className="size-1 rounded-full bg-white/[0.08]" />
                    )}
                  </div>
                )
              })}

              <div
                aria-hidden="true"
                className="border-t border-border/70"
                style={{ height: `${BASE_ROW_HEIGHT_REM}rem` }}
              />

              <motion.div
                data-testid="stack-top"
                data-top-index={topIndex}
                initial={false}
                animate={{ y: `${pointerY}rem` }}
                transition={pointerTransition}
                className="pointer-events-none absolute top-0 flex items-center"
                style={{
                  left: "calc(100% + 0.5rem)",
                  height: `${SLOT_HEIGHT_REM}rem`,
                }}
              >
                <ChevronLeft aria-hidden="true" className="size-3 text-pointer" />
                <span className="rounded-md border border-pointer/30 bg-pointer/10 px-1.5 py-0.5 font-mono text-[10px] leading-none tracking-wide text-pointer uppercase">
                  top
                </span>
              </motion.div>
            </div>
          </div>
        </div>

        <p
          data-testid="stack-hint"
          className="mt-2 text-center text-[11px] text-pretty text-muted-foreground"
        >
          {hint}
        </p>
      </div>
    </div>
  )
}
