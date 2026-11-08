"use client"

import { memo } from "react"
import { AnimatePresence, m, useReducedMotion, type Transition } from "framer-motion"
import { arraySlotId, type ArrayState } from "@/components/structures/array/engine"
import { highlightRoleMeta, resolveSlotRoles } from "@/components/structures/shared/highlight-roles"
import type { Highlight } from "@/lib/structures/types"
import { cn } from "@/lib/utils"

export interface ArrayCanvasProps {
  state: ArrayState
  highlights?: readonly Highlight[]
  className?: string
}

const SLOT_SIZE_REM = 3.5

function describeArray(state: ArrayState): string {
  const mode = state.mode === "dynamic" ? "Dynamic" : "Static"

  if (state.items.length === 0) {
    return `${mode} array with ${state.capacity} empty slots.`
  }

  const values = state.items.map((item) => item.value).join(", ")

  return `${mode} array with ${state.items.length} of ${state.capacity} slots used: ${values}.`
}

export const ArrayCanvas = memo(function ArrayCanvas({
  state,
  highlights = [],
  className,
}: ArrayCanvasProps) {
  const reduceMotion = useReducedMotion()
  const roles = resolveSlotRoles(state, highlights, arraySlotId)
  const layoutTransition: Transition = reduceMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 380, damping: 34, mass: 0.7 }

  return (
    <div
      data-testid="array-canvas"
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
            data-testid="array-capacity"
            className="font-mono text-xs font-medium text-foreground tabular-nums"
          >
            {state.capacity}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            data-testid="array-mode"
            className={cn(
              "inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[10px] tracking-wide uppercase",
              state.mode === "dynamic"
                ? "border-primary/25 bg-primary/10 text-primary"
                : "border-border/70 bg-white/[0.03] text-muted-foreground",
            )}
          >
            {state.mode}
          </span>
          <span
            data-testid="array-length"
            className="font-mono text-[10px] text-muted-foreground tabular-nums"
          >
            length {state.items.length} / {state.capacity}
          </span>
        </div>
      </div>

      <div
        role="region"
        aria-label="Array canvas"
        tabIndex={0}
        className="overflow-x-auto overscroll-x-contain rounded-lg p-3 focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none"
      >
        <div
          role="img"
          aria-label={describeArray(state)}
          className="grid w-max gap-x-2 gap-y-1.5"
          style={{
            gridTemplateColumns: `repeat(${state.capacity}, ${SLOT_SIZE_REM}rem)`,
            gridTemplateRows: "1.5rem 3.5rem",
          }}
        >
          {Array.from({ length: state.capacity }, (_, index) => {
            const role = roles.get(index)

            return (
              <div
                key={`index-${index}`}
                data-testid={`array-index-${index}`}
                data-highlight={role}
                className="flex h-6 flex-col items-center justify-end gap-0.5"
                style={{ gridColumn: index + 1, gridRow: 1 }}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-3 font-mono text-[9px] leading-none tracking-[0.08em] uppercase",
                    role ? highlightRoleMeta[role].textClassName : "invisible",
                  )}
                >
                  {role ? highlightRoleMeta[role].label : "·"}
                </span>
                <span
                  className={cn(
                    "font-mono text-[10px] leading-none tabular-nums",
                    role ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {index}
                </span>
              </div>
            )
          })}

          {Array.from({ length: state.capacity }, (_, index) => {
            const item = state.items[index]
            const role = roles.get(index)

            return (
              <m.div
                key={`slot-${index}`}
                data-testid={`array-slot-${index}`}
                data-highlight={role}
                data-empty={item ? "false" : "true"}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={layoutTransition}
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-lg border transition-[background-color,border-color,box-shadow] duration-150",
                  item
                    ? "border-border bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                    : "border-dashed border-border/60 bg-background/20",
                  role ? highlightRoleMeta[role].slotClassName : null,
                )}
                style={{ gridColumn: index + 1, gridRow: 2 }}
              >
                {item ? null : (
                  <span aria-hidden="true" className="size-1 rounded-full bg-white/[0.08]" />
                )}
              </m.div>
            )
          })}

          <AnimatePresence initial={false}>
            {state.items.map((item, index) => (
              <m.div
                key={item.id}
                data-testid={`array-item-${item.id}`}
                data-highlight={roles.get(index)}
                layout={!reduceMotion}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, scale: 0.8 }}
                transition={layoutTransition}
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
        </div>
      </div>
    </div>
  )
})
