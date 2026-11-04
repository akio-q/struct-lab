"use client"

import { useId, useRef, useState, type ReactNode } from "react"
import { useReducedMotion } from "framer-motion"
import { CircleDashed } from "lucide-react"
import { QueueCanvas } from "@/components/structures/queue/canvas"
import {
  clearQueue,
  createQueueState,
  dequeueQueue,
  enqueueQueue,
  isQueueEmpty,
  isQueueFull,
  peekQueue,
  queueHeadIndex,
  queueHeadItem,
  queueTailIndex,
  queueTailItem,
  type QueueState,
} from "@/components/structures/queue/engine"
import { ComplexityBadge } from "@/components/structures/shared/complexity-badge"
import { PlaybackControls } from "@/components/structures/shared/playback-controls"
import { PointerInspector } from "@/components/structures/shared/pointer-inspector"
import { StageFrame } from "@/components/structures/shared/stage-frame"
import { StepLog } from "@/components/structures/shared/step-log"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTracePlayer } from "@/hooks/use-trace-player"
import type { Complexity, PointerEntry } from "@/lib/structures/types"
import { cn } from "@/lib/utils"

const INITIAL_VALUES = [12, 7, 24] as const
const QUEUE_CAPACITY = 6

const IDLE_COMPLEXITY: Complexity = {
  time: "O(1)",
  space: "O(n)",
  note: "Enqueue, dequeue, and peek are O(1); the queue occupies O(n) space.",
}

function parseFiniteNumber(input: string): number | null {
  if (input.trim() === "") {
    return null
  }

  const value = Number(input)

  return Number.isFinite(value) ? value : null
}

export interface QueueViewProps {
  active?: boolean
}

export function QueueView({ active = true }: QueueViewProps) {
  const [initialState] = useState<QueueState>(() =>
    createQueueState({ capacity: QUEUE_CAPACITY, initialValues: INITIAL_VALUES }),
  )
  const [valueInput, setValueInput] = useState("42")
  const [inputError, setInputError] = useState<string | null>(null)
  const valueInputRef = useRef<HTMLInputElement>(null)
  const reduceMotion = useReducedMotion()
  const player = useTracePlayer<QueueState>({ active, autoPlay: !reduceMotion })
  const state = player.frame?.state ?? initialState
  const valueId = useId()
  const errorId = useId()

  const complexity = player.frame?.complexity ?? IDLE_COMPLEXITY
  const isEmpty = isQueueEmpty(state)
  const isFull = isQueueFull(state)
  const headIndex = queueHeadIndex(state)
  const tailIndex = queueTailIndex(state)
  const headItem = queueHeadItem(state)
  const tailItem = queueTailItem(state)
  const pointers: PointerEntry[] = [
    {
      label: "head",
      value: headItem?.value ?? null,
      tone: headItem ? "pointer" : "default",
    },
    {
      label: "head index",
      value: headIndex,
      tone: headIndex >= 0 ? "pointer" : "default",
    },
    {
      label: "tail",
      value: tailItem?.value ?? null,
      tone: tailItem ? "pointer" : "default",
    },
    {
      label: "tail index",
      value: tailIndex,
      tone: tailIndex >= 0 ? "pointer" : "default",
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

  function handleEnqueue() {
    const value = parseFiniteNumber(valueInput)

    if (value === null) {
      setInputError("Enter a finite number for the value.")
      valueInputRef.current?.focus()
      return
    }

    setInputError(null)
    player.appendFrames(enqueueQueue(state, value))
  }

  function handleDequeue() {
    setInputError(null)
    player.appendFrames(dequeueQueue(state))
  }

  function handlePeek() {
    setInputError(null)
    player.appendFrames(peekQueue(state))
  }

  function handleClear() {
    setInputError(null)
    player.appendFrames(clearQueue(state))
  }

  return (
    <div className="grid min-w-0 gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
      {/* The structure panel owns the card surface; keep the stage flush with it. */}
      <StageFrame
        title="Queue"
        description="Enqueue at the tail and dequeue from the head while the trace explains each step."
        actions={
          <span className="inline-flex items-center rounded-md border border-border/70 bg-background/40 px-2 py-1 font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
            FIFO
          </span>
        }
        contentClassName="gap-3"
        className="min-w-0 border-0 bg-transparent shadow-none"
      >
        <QueueCanvas
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
              <p className="text-xs font-medium">The queue is empty.</p>
              <p className="mt-0.5 text-[11px] text-pretty text-muted-foreground">
                Enqueue a value to add it at the tail. Dequeue and peek will underflow.
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
                name="queue-value"
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
              <Button type="button" size="sm" onClick={handleEnqueue}>
                Enqueue
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handleDequeue}>
                Dequeue
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

      <aside aria-label="Queue inspector" className="flex min-w-0 flex-col gap-3">
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
