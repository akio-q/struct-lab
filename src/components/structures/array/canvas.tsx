"use client"

import { AnimatePresence, motion, useReducedMotion, type Transition } from "framer-motion"
import { arraySlotId, type ArrayState } from "@/components/structures/array/engine"
import type { Highlight, HighlightRole } from "@/lib/structures/types"
import { cn } from "@/lib/utils"

export interface ArrayCanvasProps {
  state: ArrayState
  highlights?: readonly Highlight[]
  className?: string
}

const SLOT_SIZE_REM = 3.5

const rolePriority: Record<HighlightRole, number> = {
  remove: 6,
  insert: 5,
  active: 4,
  target: 3,
  source: 2,
  pointer: 1,
}

const roleMeta: Record<
  HighlightRole,
  { label: string; slotClassName: string; textClassName: string }
> = {
  active: {
    label: "now",
    slotClassName: "border-primary/60 bg-primary/10",
    textClassName: "text-primary",
  },
  source: {
    label: "src",
    slotClassName: "border-pointer/60 bg-pointer/10",
    textClassName: "text-pointer",
  },
  target: {
    label: "dst",
    slotClassName: "border-success/60 bg-success/10",
    textClassName: "text-success",
  },
  insert: {
    label: "new",
    slotClassName: "border-success/70 bg-success/10",
    textClassName: "text-success",
  },
  remove: {
    label: "out",
    slotClassName: "border-destructive/70 bg-destructive/10",
    textClassName: "text-destructive",
  },
  pointer: {
    label: "ptr",
    slotClassName: "border-pointer/60 bg-pointer/10",
    textClassName: "text-pointer",
  },
}

function mergeRole(current: HighlightRole | undefined, next: HighlightRole): HighlightRole {
  if (!current) {
    return next
  }

  return rolePriority[next] > rolePriority[current] ? next : current
}

function slotRoles(
  state: ArrayState,
  highlights: readonly Highlight[],
): Map<number, HighlightRole> {
  const roles = new Map<number, HighlightRole>()
  const itemRoles = new Map<string, HighlightRole>()
  const indexBySlotId = new Map<string, number>()

  for (let index = 0; index < state.capacity; index += 1) {
    indexBySlotId.set(arraySlotId(index), index)
  }

  for (const highlight of highlights) {
    if (highlight.target === "item") {
      itemRoles.set(highlight.id, mergeRole(itemRoles.get(highlight.id), highlight.role))
      continue
    }

    if (highlight.target === "slot") {
      const index = indexBySlotId.get(highlight.id)

      if (index !== undefined) {
        roles.set(index, mergeRole(roles.get(index), highlight.role))
      }
    }
  }

  for (const [index, item] of state.items.entries()) {
    const role = itemRoles.get(item.id)

    if (role) {
      roles.set(index, mergeRole(roles.get(index), role))
    }
  }

  return roles
}

function describeArray(state: ArrayState): string {
  const mode = state.mode === "dynamic" ? "Dynamic" : "Static"

  if (state.items.length === 0) {
    return `${mode} array with ${state.capacity} empty slots.`
  }

  const values = state.items.map((item) => item.value).join(", ")

  return `${mode} array with ${state.items.length} of ${state.capacity} slots used: ${values}.`
}

export function ArrayCanvas({ state, highlights = [], className }: ArrayCanvasProps) {
  const reduceMotion = useReducedMotion()
  const roles = slotRoles(state, highlights)
  const layoutTransition: Transition = reduceMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 380, damping: 34, mass: 0.7 }

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

      <div className="overflow-x-auto overscroll-x-contain p-3">
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
                    role ? roleMeta[role].textClassName : "invisible",
                  )}
                >
                  {role ? roleMeta[role].label : "·"}
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
              <motion.div
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
                  role ? roleMeta[role].slotClassName : null,
                )}
                style={{ gridColumn: index + 1, gridRow: 2 }}
              >
                {item ? null : (
                  <span aria-hidden="true" className="size-1 rounded-full bg-white/[0.08]" />
                )}
              </motion.div>
            )
          })}

          <AnimatePresence initial={false}>
            {state.items.map((item, index) => (
              <motion.div
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
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
