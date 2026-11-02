"use client"

import { useRef, type KeyboardEvent } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { structureList } from "@/lib/structures/registry"
import type { StructureId } from "@/lib/structures/types"
import { cn } from "@/lib/utils"

export interface StructureTabsProps {
  value: StructureId
  onValueChange: (value: StructureId) => void
  className?: string
}

const TAB_PILL_ID = "shell-structure-tab-pill"

export function StructureTabs({ value, onValueChange, className }: StructureTabsProps) {
  const reduceMotion = useReducedMotion()
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  function activateTab(index: number) {
    onValueChange(structureList[index].id)
    tabRefs.current[index]?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const lastIndex = structureList.length - 1
    let nextIndex: number | null = null

    switch (event.key) {
      case "ArrowRight":
        nextIndex = index === lastIndex ? 0 : index + 1
        break
      case "ArrowLeft":
        nextIndex = index === 0 ? lastIndex : index - 1
        break
      case "Home":
        nextIndex = 0
        break
      case "End":
        nextIndex = lastIndex
        break
    }

    if (nextIndex === null) {
      return
    }

    event.preventDefault()
    activateTab(nextIndex)
  }

  return (
    <div
      role="tablist"
      aria-label="Structures"
      aria-orientation="horizontal"
      className={cn(
        "inline-flex min-w-0 items-center gap-1 rounded-xl border border-border/70 bg-panel/70 p-1",
        className,
      )}
    >
      {structureList.map((structure, index) => {
        const isActive = structure.id === value

        return (
          <button
            key={structure.id}
            ref={(node) => {
              tabRefs.current[index] = node
            }}
            type="button"
            role="tab"
            id={`structure-tab-${structure.id}`}
            aria-selected={isActive}
            aria-controls={`structure-panel-${structure.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onValueChange(structure.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "relative isolate flex h-8 shrink-0 items-center rounded-lg px-3 text-[13px] font-medium whitespace-nowrap transition-colors",
              "text-muted-foreground hover:text-foreground",
              "focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none",
              isActive && "text-foreground",
            )}
          >
            {isActive ? (
              <motion.span
                aria-hidden="true"
                layoutId={TAB_PILL_ID}
                className="absolute inset-0 -z-10 rounded-lg border border-white/[0.06] bg-white/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 420, damping: 36, mass: 0.7 }
                }
              />
            ) : null}
            {structure.shortLabel}
          </button>
        )
      })}
    </div>
  )
}
