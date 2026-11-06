"use client"

import { useId, useState, type ReactNode } from "react"
import { useReducedMotion } from "framer-motion"
import { CircleDashed } from "lucide-react"
import { ArrayCanvas } from "@/components/structures/array/canvas"
import {
  accessArray,
  appendArray,
  clearArray,
  createArrayState,
  insertArray,
  isArrayEmpty,
  popArray,
  removeArray,
  setArrayMode,
  type ArrayMode,
  type ArrayState,
} from "@/components/structures/array/engine"
import { ComplexityBadge } from "@/components/structures/shared/complexity-badge"
import { PlaybackControls } from "@/components/structures/shared/playback-controls"
import { PointerInspector } from "@/components/structures/shared/pointer-inspector"
import { StageFrame } from "@/components/structures/shared/stage-frame"
import { StepLog } from "@/components/structures/shared/step-log"
import { TraceAnnouncer } from "@/components/structures/shared/trace-announcer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { useTracePlayer } from "@/hooks/use-trace-player"
import type { Complexity, PointerEntry } from "@/lib/structures/types"
import { cn } from "@/lib/utils"

const INITIAL_VALUES = [12, 7, 24] as const
const ARRAY_MODES: readonly ArrayMode[] = ["static", "dynamic"]
const MODE_LABELS: Record<ArrayMode, string> = {
  static: "Static",
  dynamic: "Dynamic",
}

const IDLE_COMPLEXITY: Complexity = {
  time: "O(1)",
  space: "O(n)",
  note: "Indexed access is O(1); the array occupies O(n) space.",
}

interface InputError {
  field: "value" | "index"
  message: string
}

function parseFiniteNumber(input: string): number | null {
  if (input.trim() === "") {
    return null
  }

  const value = Number(input)

  return Number.isFinite(value) ? value : null
}

export interface ArrayViewProps {
  active?: boolean
}

export function ArrayView({ active = true }: ArrayViewProps) {
  const [initialState] = useState<ArrayState>(() =>
    createArrayState({ initialValues: INITIAL_VALUES }),
  )
  const [valueInput, setValueInput] = useState("42")
  const [indexInput, setIndexInput] = useState("0")
  const [inputError, setInputError] = useState<InputError | null>(null)
  const reduceMotion = useReducedMotion()
  const player = useTracePlayer<ArrayState>({ active, autoPlay: !reduceMotion })
  useKeyboardShortcuts({
    active,
    speed: player.speed,
    onTogglePlay: player.togglePlay,
    onStepBack: player.stepBack,
    onStepForward: player.stepForward,
    onReset: player.reset,
    onSpeedChange: player.setSpeed,
  })
  const state = player.frame?.state ?? initialState
  const valueId = useId()
  const indexId = useId()
  const errorId = useId()

  const complexity = player.frame?.complexity ?? IDLE_COMPLEXITY
  const isEmpty = isArrayEmpty(state)
  const pointers: PointerEntry[] = [
    { label: "length", value: state.items.length },
    { label: "capacity", value: state.capacity },
    {
      label: "free",
      value: state.capacity - state.items.length,
      tone:
        state.items.length >= state.capacity
          ? state.mode === "static"
            ? "danger"
            : "pointer"
          : "default",
    },
    {
      label: "mode",
      value: state.mode,
      tone: state.mode === "dynamic" ? "pointer" : "default",
    },
  ]

  function resetInputError() {
    if (inputError) {
      setInputError(null)
    }
  }

  function handleAppend() {
    const value = parseFiniteNumber(valueInput)

    if (value === null) {
      setInputError({ field: "value", message: "Enter a finite number for the value." })
      return
    }

    setInputError(null)
    player.appendFrames(appendArray(state, value))
  }

  function handleInsert() {
    const index = parseFiniteNumber(indexInput)
    const value = parseFiniteNumber(valueInput)

    if (index === null) {
      setInputError({ field: "index", message: "Enter an index for insertion." })
      return
    }

    if (value === null) {
      setInputError({ field: "value", message: "Enter a finite number for the value." })
      return
    }

    setInputError(null)
    player.appendFrames(insertArray(state, index, value))
  }

  function handleAccess() {
    const index = parseFiniteNumber(indexInput)

    if (index === null) {
      setInputError({ field: "index", message: "Enter an index to access." })
      return
    }

    setInputError(null)
    player.appendFrames(accessArray(state, index))
  }

  function handleRemove() {
    const index = parseFiniteNumber(indexInput)

    if (index === null) {
      setInputError({ field: "index", message: "Enter an index to remove." })
      return
    }

    setInputError(null)
    player.appendFrames(removeArray(state, index))
  }

  function handlePop() {
    setInputError(null)
    player.appendFrames(popArray(state))
  }

  function handleClear() {
    setInputError(null)
    player.appendFrames(clearArray(state))
  }

  function handleModeChange(mode: ArrayMode) {
    if (state.mode === mode) {
      return
    }

    setInputError(null)
    player.appendFrames(setArrayMode(state, mode))
  }

  const modeToggle = (
    <div
      role="group"
      aria-label="Array mode"
      className="inline-flex items-center rounded-lg border border-border/70 bg-background/40 p-0.5"
    >
      {ARRAY_MODES.map((mode) => {
        const isCurrent = state.mode === mode

        return (
          <button
            key={mode}
            type="button"
            onClick={() => handleModeChange(mode)}
            aria-pressed={isCurrent}
            className={cn(
              "h-6 touch-manipulation rounded-md px-2 font-mono text-[10px] tracking-wide uppercase transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none",
              isCurrent
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
            )}
          >
            {MODE_LABELS[mode]}
          </button>
        )
      })}
    </div>
  )

  return (
    <div className="grid min-w-0 gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
      {/* The structure panel owns the card surface; keep the stage flush with it. */}
      <StageFrame
        title="Array"
        description="Append, insert, access, and remove values while the trace explains each step."
        actions={modeToggle}
        contentClassName="gap-3"
        className="min-w-0 border-0 bg-transparent shadow-none"
      >
        <TraceAnnouncer
          frame={player.frame}
          cursor={player.trace.cursor}
          total={player.trace.frames.length}
        />
        <ArrayCanvas state={state} highlights={player.frame?.highlights} />

        {isEmpty ? (
          <div className="flex items-start gap-2 rounded-xl border border-dashed border-border/70 bg-background/20 px-3 py-2.5">
            <CircleDashed
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            />
            <div className="min-w-0">
              <p className="text-xs font-medium">The array is empty.</p>
              <p className="mt-0.5 text-[11px] text-pretty text-muted-foreground">
                Append a value or insert at index 0 to start filling the buffer.
              </p>
            </div>
          </div>
        ) : null}

        <div className="rounded-xl border border-border/70 bg-background/30">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
            <h3 className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
              Operations
            </h3>
            <span className="text-[10px] text-muted-foreground">Runs from the visible step</span>
          </div>

          <div className="p-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex min-w-0 flex-col gap-1">
                <label
                  htmlFor={valueId}
                  className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase"
                >
                  Value
                </label>
                <Input
                  id={valueId}
                  name="array-value"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  autoComplete="off"
                  spellCheck={false}
                  value={valueInput}
                  onChange={(event) => {
                    setValueInput(event.target.value)
                    resetInputError()
                  }}
                  aria-invalid={inputError?.field === "value" ? true : undefined}
                  aria-describedby={inputError?.field === "value" ? errorId : undefined}
                  className="font-mono text-sm tabular-nums"
                />
              </div>

              <div className="flex min-w-0 flex-col gap-1">
                <label
                  htmlFor={indexId}
                  className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase"
                >
                  Index
                </label>
                <Input
                  id={indexId}
                  name="array-index"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  autoComplete="off"
                  spellCheck={false}
                  value={indexInput}
                  onChange={(event) => {
                    setIndexInput(event.target.value)
                    resetInputError()
                  }}
                  aria-invalid={inputError?.field === "index" ? true : undefined}
                  aria-describedby={inputError?.field === "index" ? errorId : undefined}
                  className="font-mono text-sm tabular-nums"
                />
              </div>
            </div>

            {inputError ? (
              <p id={errorId} role="alert" className="mt-2 text-[11px] text-destructive">
                {inputError.message}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-1.5">
              <Button type="button" size="sm" onClick={handleAppend}>
                Append
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handleInsert}>
                Insert
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handleAccess}>
                Access
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handleRemove}>
                Remove
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handlePop}>
                Pop
              </Button>
              <Button type="button" size="sm" variant="destructive" onClick={handleClear}>
                Clear
              </Button>
            </div>
          </div>
        </div>
      </StageFrame>

      <aside aria-label="Array inspector" className="flex min-w-0 flex-col gap-3">
        <InspectorSection title="Current step">
          <p className="font-mono text-xs text-foreground">
            {player.frame ? `${player.frame.operation} · ${player.frame.phase}` : "Idle"}
          </p>
          <p className="mt-1 text-xs text-pretty text-muted-foreground">
            {player.frame?.detail ?? "Run an operation to start a trace."}
          </p>
        </InspectorSection>

        <InspectorSection title="Complexity">
          <ComplexityBadge complexity={complexity} />
        </InspectorSection>

        <InspectorSection title="State">
          <PointerInspector pointers={pointers} />
        </InspectorSection>

        <InspectorSection title="Trace">
          <StepLog
            entries={player.trace.frames}
            cursor={player.trace.cursor}
            onSelect={player.selectFrame}
            className="max-h-56 overflow-y-auto overscroll-y-contain pr-1"
          />
        </InspectorSection>

        <InspectorSection title="Playback">
          <PlaybackControls
            status={player.status}
            speed={player.speed}
            cursor={player.trace.cursor}
            total={player.trace.frames.length}
            onTogglePlay={player.togglePlay}
            onStepBack={player.stepBack}
            onStepForward={player.stepForward}
            onReset={player.reset}
            onSpeedChange={player.setSpeed}
          />
        </InspectorSection>
      </aside>
    </div>
  )
}

interface InspectorSectionProps {
  title: string
  children: ReactNode
  className?: string
}

function InspectorSection({ title, children, className }: InspectorSectionProps) {
  return (
    <section className={cn("rounded-xl border border-border/70 bg-background/30 p-3", className)}>
      <h3 className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
        {title}
      </h3>
      <div className="mt-2">{children}</div>
    </section>
  )
}
