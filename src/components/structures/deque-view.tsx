"use client"

import { useId, useRef, useState, type ReactNode } from "react"
import { useReducedMotion } from "framer-motion"
import { CircleDashed } from "lucide-react"
import { DequeCanvas } from "@/components/structures/deque/canvas"
import {
  clearDeque,
  createDequeState,
  dequeBackIndex,
  dequeBackItem,
  dequeFrontIndex,
  dequeFrontItem,
  isDequeEmpty,
  isDequeFull,
  peekBackDeque,
  peekFrontDeque,
  popBackDeque,
  popFrontDeque,
  pushBackDeque,
  pushFrontDeque,
  type DequeState,
} from "@/components/structures/deque/engine"
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
const DEQUE_CAPACITY = 6

const IDLE_COMPLEXITY: Complexity = {
  time: "O(1)",
  space: "O(n)",
  note: "Push, pop, and peek at both ends are O(1); the deque occupies O(n) space.",
}

function parseFiniteNumber(input: string): number | null {
  if (input.trim() === "") {
    return null
  }

  const value = Number(input)

  return Number.isFinite(value) ? value : null
}

export interface DequeViewProps {
  active?: boolean
}

export function DequeView({ active = true }: DequeViewProps) {
  const [initialState] = useState<DequeState>(() =>
    createDequeState({ capacity: DEQUE_CAPACITY, initialValues: INITIAL_VALUES }),
  )
  const [valueInput, setValueInput] = useState("42")
  const [inputError, setInputError] = useState<string | null>(null)
  const valueInputRef = useRef<HTMLInputElement>(null)
  const reduceMotion = useReducedMotion()
  const player = useTracePlayer<DequeState>({ active, autoPlay: !reduceMotion })
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
  const errorId = useId()

  const complexity = player.frame?.complexity ?? IDLE_COMPLEXITY
  const isEmpty = isDequeEmpty(state)
  const isFull = isDequeFull(state)
  const frontIndex = dequeFrontIndex(state)
  const backIndex = dequeBackIndex(state)
  const frontItem = dequeFrontItem(state)
  const backItem = dequeBackItem(state)
  const pointers: PointerEntry[] = [
    {
      label: "front",
      value: frontItem?.value ?? null,
      tone: frontItem ? "pointer" : "default",
    },
    {
      label: "front index",
      value: frontIndex,
      tone: frontIndex >= 0 ? "pointer" : "default",
    },
    {
      label: "back",
      value: backItem?.value ?? null,
      tone: backItem ? "pointer" : "default",
    },
    {
      label: "back index",
      value: backIndex,
      tone: backIndex >= 0 ? "pointer" : "default",
    },
    { label: "size", value: `${state.items.length} / ${state.capacity}` },
    {
      label: "free",
      value: state.capacity - state.items.length,
      tone: isFull ? "danger" : "default",
    },
    {
      label: "status",
      value: isEmpty ? "empty" : isFull ? "full" : "open",
      tone: isFull ? "danger" : isEmpty ? "default" : "success",
    },
  ]

  function resetInputError() {
    if (inputError) {
      setInputError(null)
    }
  }

  function handlePushFront() {
    const value = parseFiniteNumber(valueInput)

    if (value === null) {
      setInputError("Enter a finite number for the value.")
      valueInputRef.current?.focus()
      return
    }

    setInputError(null)
    player.appendFrames(pushFrontDeque(state, value))
  }

  function handlePushBack() {
    const value = parseFiniteNumber(valueInput)

    if (value === null) {
      setInputError("Enter a finite number for the value.")
      valueInputRef.current?.focus()
      return
    }

    setInputError(null)
    player.appendFrames(pushBackDeque(state, value))
  }

  function handlePopFront() {
    setInputError(null)
    player.appendFrames(popFrontDeque(state))
  }

  function handlePopBack() {
    setInputError(null)
    player.appendFrames(popBackDeque(state))
  }

  function handlePeekFront() {
    setInputError(null)
    player.appendFrames(peekFrontDeque(state))
  }

  function handlePeekBack() {
    setInputError(null)
    player.appendFrames(peekBackDeque(state))
  }

  function handleClear() {
    setInputError(null)
    player.appendFrames(clearDeque(state))
  }

  return (
    <div className="grid min-w-0 gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
      {/* The structure panel owns the card surface; keep the stage flush with it. */}
      <StageFrame
        title="Deque"
        description="Push and pop at both ends while the trace explains each step."
        actions={
          <span className="inline-flex items-center rounded-md border border-border/70 bg-background/40 px-2 py-1 font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
            Both ends
          </span>
        }
        contentClassName="gap-3"
        className="min-w-0 border-0 bg-transparent shadow-none"
      >
        <TraceAnnouncer
          frame={player.frame}
          cursor={player.trace.cursor}
          total={player.trace.frames.length}
        />
        <DequeCanvas
          state={state}
          highlights={player.frame?.highlights}
          feedback={player.frame?.feedback}
        />

        {isEmpty ? (
          <div className="flex items-start gap-2 rounded-xl border border-dashed border-border/70 bg-background/20 px-3 py-2.5">
            <CircleDashed
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            />
            <div className="min-w-0">
              <p className="text-xs font-medium">The deque is empty.</p>
              <p className="mt-0.5 text-[11px] text-pretty text-muted-foreground">
                Push a value to either end. Pop and peek at both ends will underflow.
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
            <div className="flex max-w-40 flex-col gap-1">
              <label
                htmlFor={valueId}
                className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase"
              >
                Value
              </label>
              <Input
                ref={valueInputRef}
                id={valueId}
                name="deque-value"
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
                aria-invalid={inputError ? true : undefined}
                aria-describedby={inputError ? errorId : undefined}
                className="font-mono text-sm tabular-nums"
              />
            </div>

            {inputError ? (
              <p id={errorId} role="alert" className="mt-2 text-[11px] text-destructive">
                {inputError}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-1.5">
              <Button type="button" size="sm" onClick={handlePushFront}>
                Push front
              </Button>
              <Button type="button" size="sm" onClick={handlePushBack}>
                Push back
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handlePopFront}>
                Pop front
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handlePopBack}>
                Pop back
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handlePeekFront}>
                Peek front
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handlePeekBack}>
                Peek back
              </Button>
              <Button type="button" size="sm" variant="destructive" onClick={handleClear}>
                Clear
              </Button>
            </div>
          </div>
        </div>
      </StageFrame>

      <aside aria-label="Deque inspector" className="flex min-w-0 flex-col gap-3">
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
