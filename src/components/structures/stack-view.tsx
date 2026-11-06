"use client"

import { useId, useRef, useState } from "react"
import { useReducedMotion } from "framer-motion"
import { CircleDashed } from "lucide-react"
import { StackCanvas } from "@/components/structures/stack/canvas"
import {
  clearStack,
  createStackState,
  isStackEmpty,
  isStackFull,
  peekStack,
  popStack,
  pushStack,
  stackTopIndex,
  stackTopItem,
  type StackState,
} from "@/components/structures/stack/engine"
import { ComplexityBadge } from "@/components/structures/shared/complexity-badge"
import { InspectorPanel, InspectorSection } from "@/components/structures/shared/inspector-panel"
import { PlaybackControls } from "@/components/structures/shared/playback-controls"
import { PlaybackDock } from "@/components/structures/shared/playback-dock"
import { PointerInspector } from "@/components/structures/shared/pointer-inspector"
import { StageFrame } from "@/components/structures/shared/stage-frame"
import { StepLog } from "@/components/structures/shared/step-log"
import { TraceAnnouncer } from "@/components/structures/shared/trace-announcer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { useTracePlayer } from "@/hooks/use-trace-player"
import type { Complexity, PointerEntry } from "@/lib/structures/types"

const INITIAL_VALUES = [12, 7, 24] as const
const STACK_CAPACITY = 6

const IDLE_COMPLEXITY: Complexity = {
  time: "O(1)",
  space: "O(n)",
  note: "Push, pop, and peek are O(1); the stack occupies O(n) space.",
}

function parseFiniteNumber(input: string): number | null {
  if (input.trim() === "") {
    return null
  }

  const value = Number(input)

  return Number.isFinite(value) ? value : null
}

export interface StackViewProps {
  active?: boolean
}

export function StackView({ active = true }: StackViewProps) {
  const [initialState] = useState<StackState>(() =>
    createStackState({ capacity: STACK_CAPACITY, initialValues: INITIAL_VALUES }),
  )
  const [valueInput, setValueInput] = useState("42")
  const [inputError, setInputError] = useState<string | null>(null)
  const valueInputRef = useRef<HTMLInputElement>(null)
  const reduceMotion = useReducedMotion()
  const player = useTracePlayer<StackState>({ active, autoPlay: !reduceMotion })
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
  const isEmpty = isStackEmpty(state)
  const isFull = isStackFull(state)
  const topIndex = stackTopIndex(state)
  const topItem = stackTopItem(state)
  const pointers: PointerEntry[] = [
    {
      label: "top",
      value: topItem?.value ?? null,
      tone: topItem ? "pointer" : "default",
    },
    {
      label: "top index",
      value: topIndex,
      tone: topIndex >= 0 ? "pointer" : "default",
    },
    { label: "depth", value: `${state.items.length} / ${state.capacity}` },
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

  function handlePush() {
    const value = parseFiniteNumber(valueInput)

    if (value === null) {
      setInputError("Enter a finite number for the value.")
      valueInputRef.current?.focus()
      return
    }

    setInputError(null)
    player.appendFrames(pushStack(state, value))
  }

  function handlePop() {
    setInputError(null)
    player.appendFrames(popStack(state))
  }

  function handlePeek() {
    setInputError(null)
    player.appendFrames(peekStack(state))
  }

  function handleClear() {
    setInputError(null)
    player.appendFrames(clearStack(state))
  }

  return (
    <div className="grid min-w-0 gap-4 p-4 pb-40 sm:p-5 sm:pb-40 lg:grid-cols-[minmax(0,1fr)_20rem] lg:pb-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      {/* The structure panel owns the card surface; keep the stage flush with it. */}
      <StageFrame
        title="Stack"
        description="Push and pop from the top while the trace explains each step."
        actions={
          <span className="inline-flex items-center rounded-md border border-border/70 bg-background/40 px-2 py-1 font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
            LIFO
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
        <StackCanvas
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
              <p className="text-xs font-medium">The stack is empty.</p>
              <p className="mt-0.5 text-[11px] text-pretty text-muted-foreground">
                Push a value to place it at the top. Pop and peek will underflow.
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
                name="stack-value"
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
              <Button type="button" size="sm" onClick={handlePush}>
                Push
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handlePop}>
                Pop
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handlePeek}>
                Peek
              </Button>
              <Button type="button" size="sm" variant="destructive" onClick={handleClear}>
                Clear
              </Button>
            </div>
          </div>
        </div>
      </StageFrame>

      <InspectorPanel label="Stack inspector">
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

        <PlaybackDock>
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
        </PlaybackDock>
      </InspectorPanel>
    </div>
  )
}
