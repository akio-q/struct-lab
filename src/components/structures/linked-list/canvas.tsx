"use client"

import { AnimatePresence, motion, useReducedMotion, type Transition } from "framer-motion"
import { TriangleAlert } from "lucide-react"
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import {
  checkLinkedListIntegrity,
  findLinkedListNode,
  linkedListLinks,
  type LinkedListDirection,
  type LinkedListNode,
  type LinkedListPointerRef,
  type LinkedListState,
} from "@/components/structures/linked-list/engine"
import {
  highlightRoleMeta,
  mergeHighlightRole,
} from "@/components/structures/shared/highlight-roles"
import type { Feedback, Highlight, HighlightRole } from "@/lib/structures/types"
import { cn } from "@/lib/utils"

export interface LinkedListCanvasProps {
  state: LinkedListState
  highlights?: readonly Highlight[]
  feedback?: Feedback
  className?: string
  selectedPointer?: LinkedListPointerRef | null
  onPointerSelect?: (pointer: LinkedListPointerRef) => void
  onRelinkTarget?: (nodeId: string) => void
  onRepair?: () => void
}

export const LINKED_LIST_NODE_WIDTH = 112
export const LINKED_LIST_NODE_HEIGHT = 88
export const LINKED_LIST_NODE_GAP = 56

const LINK_LANE_OFFSET = 12
const LINK_ARROW_GAP = 6
const LINK_MIN_CONTROL = 16
const LINK_LOOP_HEIGHT = 24
const EMPTY_HIGHLIGHTS: readonly Highlight[] = []

type LinkTone = HighlightRole | "default"

const linkToneMeta: Record<LinkTone, { stroke: string; marker: string }> = {
  default: {
    stroke: "stroke-muted-foreground/50",
    marker: "fill-muted-foreground/50",
  },
  active: { stroke: "stroke-primary", marker: "fill-primary" },
  source: { stroke: "stroke-pointer", marker: "fill-pointer" },
  target: { stroke: "stroke-success", marker: "fill-success" },
  insert: { stroke: "stroke-success", marker: "fill-success" },
  remove: { stroke: "stroke-destructive", marker: "fill-destructive" },
  pointer: { stroke: "stroke-pointer", marker: "fill-pointer" },
}

const LINK_TONES = Object.keys(linkToneMeta) as LinkTone[]

export interface LinkedListNodeBox {
  id: string
  x: number
  y: number
  width: number
  height: number
}

export interface LinkedListLinkGeometry {
  id: string
  nodeId: string
  targetId: string
  direction: LinkedListDirection
  d: string
}

/**
 * Deterministic layout used before the DOM is measured. The canvas uses the
 * same pixel dimensions, so the fallback also matches the first paint.
 */
export function layoutLinkedListNodes(nodes: readonly LinkedListNode[]): LinkedListNodeBox[] {
  return nodes.map((node, index) => ({
    id: node.id,
    x: index * (LINKED_LIST_NODE_WIDTH + LINKED_LIST_NODE_GAP),
    y: 0,
    width: LINKED_LIST_NODE_WIDTH,
    height: LINKED_LIST_NODE_HEIGHT,
  }))
}

function roundCoordinate(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Builds one cubic path per pointer. `next` links travel left-to-right along
 * the upper lane, while `prev` links travel right-to-left along the lower lane.
 */
export function buildLinkedListPath(
  source: LinkedListNodeBox,
  target: LinkedListNodeBox,
  direction: LinkedListDirection,
): string {
  const sourceY = source.y + source.height / 2
  const targetY = target.y + target.height / 2

  if (direction === "next") {
    const startX = source.x + source.width
    const startY = sourceY - LINK_LANE_OFFSET

    // A next pointer that points left is a cycle or a manual relink. Route it
    // over the nodes so it stays visible instead of stretching off-canvas.
    if (target.x < source.x) {
      const endX = target.x + target.width + LINK_ARROW_GAP
      const endY = targetY - LINK_LANE_OFFSET
      const loopY = Math.min(source.y, target.y) - LINK_LOOP_HEIGHT

      return [
        `M ${roundCoordinate(startX)} ${roundCoordinate(startY)}`,
        `C ${roundCoordinate(startX)} ${roundCoordinate(loopY)},`,
        `${roundCoordinate(endX)} ${roundCoordinate(loopY)},`,
        `${roundCoordinate(endX)} ${roundCoordinate(endY)}`,
      ].join(" ")
    }

    const endX = target.x - LINK_ARROW_GAP
    const endY = targetY - LINK_LANE_OFFSET
    const curve = Math.max(LINK_MIN_CONTROL, Math.abs(endX - startX) / 2)

    return [
      `M ${roundCoordinate(startX)} ${roundCoordinate(startY)}`,
      `C ${roundCoordinate(startX + curve)} ${roundCoordinate(startY)},`,
      `${roundCoordinate(endX - curve)} ${roundCoordinate(endY)},`,
      `${roundCoordinate(endX)} ${roundCoordinate(endY)}`,
    ].join(" ")
  }

  const startX = source.x
  const startY = sourceY + LINK_LANE_OFFSET

  // A prev pointer that points right is likewise abnormal; route it under the
  // nodes so the loop remains on screen.
  if (target.x > source.x) {
    const endX = target.x - LINK_ARROW_GAP
    const endY = targetY + LINK_LANE_OFFSET
    const loopY = Math.max(source.y + source.height, target.y + target.height) + LINK_LOOP_HEIGHT

    return [
      `M ${roundCoordinate(startX)} ${roundCoordinate(startY)}`,
      `C ${roundCoordinate(startX)} ${roundCoordinate(loopY)},`,
      `${roundCoordinate(endX)} ${roundCoordinate(loopY)},`,
      `${roundCoordinate(endX)} ${roundCoordinate(endY)}`,
    ].join(" ")
  }

  const endX = target.x + target.width + LINK_ARROW_GAP
  const endY = targetY + LINK_LANE_OFFSET
  const curve = Math.max(LINK_MIN_CONTROL, Math.abs(startX - endX) / 2)

  return [
    `M ${roundCoordinate(startX)} ${roundCoordinate(startY)}`,
    `C ${roundCoordinate(startX - curve)} ${roundCoordinate(startY)},`,
    `${roundCoordinate(endX + curve)} ${roundCoordinate(endY)},`,
    `${roundCoordinate(endX)} ${roundCoordinate(endY)}`,
  ].join(" ")
}

/**
 * Resolves stored pointers against measured node boxes. Links whose target is
 * missing from the layout are skipped rather than drawn to the origin.
 */
export function buildLinkedListLinks(
  state: LinkedListState,
  boxes: readonly LinkedListNodeBox[],
): LinkedListLinkGeometry[] {
  const boxesById = new Map(boxes.map((box) => [box.id, box]))

  return linkedListLinks(state).flatMap((link) => {
    const source = boxesById.get(link.nodeId)
    const target = boxesById.get(link.targetId)

    if (!source || !target) {
      return []
    }

    return [
      {
        ...link,
        d: buildLinkedListPath(source, target, link.direction),
      },
    ]
  })
}

function sameBoxes(current: readonly LinkedListNodeBox[], next: readonly LinkedListNodeBox[]) {
  if (current.length !== next.length) {
    return false
  }

  return current.every((box, index) => {
    const other = next[index]

    return (
      other !== undefined &&
      box.id === other.id &&
      Math.abs(box.x - other.x) < 0.5 &&
      Math.abs(box.y - other.y) < 0.5 &&
      Math.abs(box.width - other.width) < 0.5 &&
      Math.abs(box.height - other.height) < 0.5
    )
  })
}

function resolveTargetRoles(
  highlights: readonly Highlight[],
  target: "node" | "edge",
): Map<string, HighlightRole> {
  const roles = new Map<string, HighlightRole>()

  for (const highlight of highlights) {
    if (highlight.target !== target) {
      continue
    }

    roles.set(highlight.id, mergeHighlightRole(roles.get(highlight.id), highlight.role))
  }

  return roles
}

function describeLinkedList(state: LinkedListState): string {
  if (state.nodes.length === 0) {
    return "Empty doubly linked list."
  }

  const values = state.nodes.map((node) => node.value).join(", ")
  const head = state.nodes[0]
  const tail = state.nodes[state.nodes.length - 1]

  return `Doubly linked list with ${state.nodes.length} nodes; head is ${head.value} at ${head.address}, tail is ${tail.value} at ${tail.address}. Values from head to tail: ${values}.`
}

export function LinkedListCanvas({
  state,
  highlights = EMPTY_HIGHLIGHTS,
  feedback = "neutral",
  className,
  selectedPointer = null,
  onPointerSelect,
  onRelinkTarget,
  onRepair,
}: LinkedListCanvasProps) {
  const reduceMotion = useReducedMotion()
  const markerPrefix = useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const descriptionId = useId()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const nodeElements = useRef(new Map<string, HTMLDivElement>())
  const [boxes, setBoxes] = useState<LinkedListNodeBox[]>(() => layoutLinkedListNodes(state.nodes))

  const isEmpty = state.nodes.length === 0

  const measure = useCallback(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    const containerRect = container.getBoundingClientRect()
    const measured: LinkedListNodeBox[] = []

    for (const node of state.nodes) {
      const element = nodeElements.current.get(node.id)

      if (!element) {
        continue
      }

      const rect = element.getBoundingClientRect()

      if (rect.width <= 0 || rect.height <= 0) {
        continue
      }

      measured.push({
        id: node.id,
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
        width: rect.width,
        height: rect.height,
      })
    }

    const next =
      measured.length === state.nodes.length ? measured : layoutLinkedListNodes(state.nodes)

    setBoxes((current) => (sameBoxes(current, next) ? current : next))
  }, [state.nodes])

  useEffect(() => {
    measure()

    const container = containerRef.current
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => measure())

    if (container) {
      observer?.observe(container)
    }

    for (const element of nodeElements.current.values()) {
      observer?.observe(element)
    }

    window.addEventListener("resize", measure)

    return () => {
      observer?.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [measure])

  const links = useMemo(() => buildLinkedListLinks(state, boxes), [state, boxes])
  const boxesById = useMemo(() => new Map(boxes.map((box) => [box.id, box])), [boxes])
  const hasLoopAbove = useMemo(
    () =>
      links.some((link) => {
        if (link.direction !== "next") {
          return false
        }

        const source = boxesById.get(link.nodeId)
        const target = boxesById.get(link.targetId)

        return Boolean(source && target && target.x < source.x)
      }),
    [links, boxesById],
  )
  const hasLoopBelow = useMemo(
    () =>
      links.some((link) => {
        if (link.direction !== "prev") {
          return false
        }

        const source = boxesById.get(link.nodeId)
        const target = boxesById.get(link.targetId)

        return Boolean(source && target && target.x > source.x)
      }),
    [links, boxesById],
  )
  const nodeRoles = useMemo(() => resolveTargetRoles(highlights, "node"), [highlights])
  const linkRoles = useMemo(() => resolveTargetRoles(highlights, "edge"), [highlights])
  const integrity = useMemo(() => checkLinkedListIntegrity(state), [state])

  const selectedNode = selectedPointer ? findLinkedListNode(state, selectedPointer.nodeId) : null
  const selectedTargetId =
    selectedNode && selectedPointer
      ? selectedPointer.direction === "next"
        ? selectedNode.nextId
        : selectedNode.prevId
      : null
  const selectedTarget = findLinkedListNode(state, selectedTargetId)
  const selectedTargetLabel = selectedTarget
    ? String(selectedTarget.value)
    : selectedTargetId
      ? "missing"
      : "null"
  const relinking = Boolean(selectedPointer && selectedNode && onRelinkTarget)

  const linkTransition: Transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.36, ease: "easeInOut" }

  const nodeTransition: Transition = reduceMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 420, damping: 32, mass: 0.6 }

  const status = isEmpty ? "empty" : integrity.status === "ok" ? "linked" : integrity.status
  const statusClassName = isEmpty
    ? "border-border/70 bg-white/[0.03] text-muted-foreground"
    : integrity.status === "ok"
      ? "border-success/25 bg-success/10 text-success"
      : "border-destructive/40 bg-destructive/10 text-destructive"
  const hint = isEmpty
    ? "Empty list — nodes will appear here with prev and next pointers."
    : selectedPointer && selectedNode
      ? `Selected ${selectedNode.value}.${selectedPointer.direction} → ${selectedTargetLabel} — ${
          onRelinkTarget ? "click a node to relink it" : "select another pointer"
        }.`
      : "Next pointers run above the nodes; prev pointers run below."

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
            Nodes
          </span>
          <span
            data-testid="linked-list-size"
            className="font-mono text-xs font-medium text-foreground tabular-nums"
          >
            {state.nodes.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            data-testid="linked-list-status"
            className={cn(
              "inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[10px] tracking-wide uppercase",
              statusClassName,
            )}
          >
            {status}
          </span>
          <span
            data-testid="linked-list-link-count"
            className="font-mono text-[10px] text-muted-foreground tabular-nums"
          >
            {links.length} links
          </span>
        </div>
      </div>

      {integrity.status !== "ok" ? (
        <div
          data-testid="linked-list-integrity-warning"
          data-integrity={integrity.status}
          role="status"
          className="flex items-start gap-2 border-b border-destructive/30 bg-destructive/[0.06] px-3 py-2"
        >
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-destructive" />
          <div className="min-w-0">
            <p className="font-mono text-[10px] tracking-[0.12em] text-destructive uppercase">
              {integrity.status === "cycle" ? "Cycle detected" : "Broken links"}
            </p>
            <p className="mt-0.5 text-[11px] text-pretty text-muted-foreground">
              {integrity.issues[0]?.detail}
              {integrity.issues.length > 1
                ? ` (+${integrity.issues.length - 1} more issue${
                    integrity.issues.length - 1 === 1 ? "" : "s"
                  })`
                : ""}
            </p>
          </div>
          {onRepair ? (
            <button
              type="button"
              onClick={onRepair}
              className="ml-auto shrink-0 rounded-md border border-destructive/40 px-2 py-1 font-mono text-[10px] tracking-[0.08em] text-destructive uppercase transition-colors hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              Repair links
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="p-3">
        <div
          data-testid="linked-list-stage"
          data-feedback={feedback}
          data-integrity={integrity.status}
          className={cn(
            "rounded-xl border p-3 transition-[border-color,background-color] duration-150",
            feedback === "error"
              ? "border-destructive/50 bg-destructive/[0.03]"
              : "border-border/60 bg-background/20",
          )}
        >
          <div
            role="region"
            aria-label="Linked list canvas"
            aria-describedby={descriptionId}
            tabIndex={0}
            className={cn(
              "overflow-x-auto overscroll-x-contain rounded-lg focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none",
              hasLoopAbove && "pt-8",
              hasLoopBelow && "pb-8",
            )}
          >
            <div ref={containerRef} className="relative mx-auto w-max">
              <p
                id={descriptionId}
                role="img"
                aria-label={describeLinkedList(state)}
                className="sr-only"
              />
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 size-full overflow-visible"
              >
                <defs>
                  {LINK_TONES.map((tone) => (
                    <marker
                      key={tone}
                      id={`${markerPrefix}-${tone}`}
                      viewBox="0 0 8 8"
                      refX="7"
                      refY="4"
                      markerWidth="7"
                      markerHeight="7"
                      markerUnits="userSpaceOnUse"
                      orient="auto"
                    >
                      <path d="M 0 0 L 8 4 L 0 8 Z" className={linkToneMeta[tone].marker} />
                    </marker>
                  ))}
                </defs>

                <AnimatePresence initial={false}>
                  {links.map((link) => {
                    const role = linkRoles.get(link.id)
                    const tone: LinkTone = role ?? "default"

                    return (
                      <motion.path
                        key={link.id}
                        data-testid={`linked-list-edge-${link.id}`}
                        data-direction={link.direction}
                        data-highlight={role}
                        d={link.d}
                        fill="none"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        markerEnd={`url(#${markerPrefix}-${tone})`}
                        className={cn(
                          "transition-[stroke] duration-150",
                          linkToneMeta[tone].stroke,
                        )}
                        initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        exit={reduceMotion ? undefined : { pathLength: 0, opacity: 0 }}
                        transition={linkTransition}
                      />
                    )
                  })}
                </AnimatePresence>
              </svg>

              <div
                className="relative flex items-center"
                style={{
                  gap: `${LINKED_LIST_NODE_GAP}px`,
                  minHeight: `${LINKED_LIST_NODE_HEIGHT}px`,
                }}
              >
                {isEmpty ? (
                  <div className="flex h-[88px] w-64 items-center justify-center rounded-xl border border-dashed border-border/60 bg-background/20 px-4">
                    <span className="text-center text-[11px] text-pretty text-muted-foreground">
                      No nodes yet
                    </span>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {state.nodes.map((node, index) => {
                      const role = nodeRoles.get(node.id)
                      const isFirst = index === 0
                      const isLast = index === state.nodes.length - 1
                      const enterX = isFirst ? -24 : isLast ? 24 : 0
                      const isSelectedSource = selectedPointer?.nodeId === node.id
                      const isNextSelected =
                        selectedPointer?.nodeId === node.id && selectedPointer.direction === "next"
                      const isPrevSelected =
                        selectedPointer?.nodeId === node.id && selectedPointer.direction === "prev"
                      const nextTarget = findLinkedListNode(state, node.nextId)
                      const prevTarget = findLinkedListNode(state, node.prevId)
                      const isCurrentTarget = selectedTargetId === node.id

                      return (
                        <motion.div
                          key={node.id}
                          ref={(element) => {
                            if (element) {
                              nodeElements.current.set(node.id, element)
                            } else {
                              nodeElements.current.delete(node.id)
                            }
                          }}
                          data-testid={`linked-list-card-${node.id}`}
                          data-highlight={role}
                          layout={!reduceMotion}
                          initial={
                            reduceMotion ? false : { opacity: 0, scale: 0.9, x: enterX, y: 8 }
                          }
                          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                          exit={reduceMotion ? undefined : { opacity: 0, scale: 0.9, y: 8 }}
                          transition={nodeTransition}
                          onLayoutAnimationComplete={measure}
                          className={cn(
                            "relative flex shrink-0 flex-col items-center justify-center rounded-xl border bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-[background-color,border-color,box-shadow] duration-150",
                            role ? highlightRoleMeta[role].slotClassName : "border-border",
                            isSelectedSource && "ring-1 ring-primary/40",
                          )}
                          style={{
                            width: `${LINKED_LIST_NODE_WIDTH}px`,
                            height: `${LINKED_LIST_NODE_HEIGHT}px`,
                          }}
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

                          {onPointerSelect ? (
                            <>
                              <button
                                type="button"
                                aria-label={`next pointer of ${node.value} ${
                                  nextTarget ? `to ${nextTarget.value}` : "is null"
                                }`}
                                aria-pressed={isNextSelected}
                                data-testid={`linked-list-pointer-${node.id}:next`}
                                data-selected={isNextSelected ? "true" : undefined}
                                onClick={() =>
                                  onPointerSelect({ nodeId: node.id, direction: "next" })
                                }
                                className="group absolute right-0 z-10 flex size-6 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                style={{ top: `calc(50% - ${LINK_LANE_OFFSET}px)` }}
                              >
                                <span
                                  aria-hidden="true"
                                  className={cn(
                                    "size-3 rounded-full border transition-[background-color,border-color,box-shadow] duration-150",
                                    isNextSelected
                                      ? "border-primary bg-primary ring-2 ring-primary/40"
                                      : nextTarget
                                        ? "border-muted-foreground/70 bg-muted-foreground/70 group-hover:border-primary group-hover:bg-primary"
                                        : "border-muted-foreground/60 bg-background group-hover:border-primary group-hover:bg-primary/40",
                                  )}
                                />
                              </button>
                              <button
                                type="button"
                                aria-label={`prev pointer of ${node.value} ${
                                  prevTarget ? `to ${prevTarget.value}` : "is null"
                                }`}
                                aria-pressed={isPrevSelected}
                                data-testid={`linked-list-pointer-${node.id}:prev`}
                                data-selected={isPrevSelected ? "true" : undefined}
                                onClick={() =>
                                  onPointerSelect({ nodeId: node.id, direction: "prev" })
                                }
                                className="group absolute left-0 z-10 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                style={{ top: `calc(50% + ${LINK_LANE_OFFSET}px)` }}
                              >
                                <span
                                  aria-hidden="true"
                                  className={cn(
                                    "size-3 rounded-full border transition-[background-color,border-color,box-shadow] duration-150",
                                    isPrevSelected
                                      ? "border-primary bg-primary ring-2 ring-primary/40"
                                      : prevTarget
                                        ? "border-muted-foreground/70 bg-muted-foreground/70 group-hover:border-primary group-hover:bg-primary"
                                        : "border-muted-foreground/60 bg-background group-hover:border-primary group-hover:bg-primary/40",
                                  )}
                                />
                              </button>
                            </>
                          ) : (
                            <>
                              <span
                                aria-hidden="true"
                                className="absolute right-0 size-1.5 translate-x-1/2 -translate-y-1/2 rounded-full bg-muted-foreground/70"
                                style={{ top: `calc(50% - ${LINK_LANE_OFFSET}px)` }}
                              />
                              <span
                                aria-hidden="true"
                                className="absolute left-0 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted-foreground/70"
                                style={{ top: `calc(50% + ${LINK_LANE_OFFSET}px)` }}
                              />
                            </>
                          )}

                          <span
                            className="max-w-full truncate px-3 text-center font-mono text-base font-medium text-foreground tabular-nums"
                            title={String(node.value)}
                          >
                            {node.value}
                          </span>

                          {relinking ? (
                            <button
                              type="button"
                              aria-label={`Relink selected pointer to ${node.value}`}
                              data-testid={`linked-list-relink-${node.id}`}
                              disabled={isSelectedSource || isCurrentTarget}
                              onClick={() => onRelinkTarget?.(node.id)}
                              className={cn(
                                "absolute inset-x-2 bottom-1 rounded-md border px-1 py-0.5 font-mono text-[9px] leading-none tracking-[0.08em] uppercase transition-colors",
                                isSelectedSource || isCurrentTarget
                                  ? "cursor-not-allowed border-border/50 text-muted-foreground/50"
                                  : "border-primary/40 text-primary hover:border-primary hover:bg-primary/10",
                              )}
                            >
                              {isCurrentTarget ? "linked" : "relink"}
                            </button>
                          ) : null}
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>
        </div>

        <p
          data-testid="linked-list-hint"
          className="mt-2 text-center text-[11px] text-pretty text-muted-foreground"
        >
          {hint}
        </p>
      </div>
    </div>
  )
}
