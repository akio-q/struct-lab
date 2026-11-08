"use client"

import { useCallback, useId, useRef, useState } from "react"
import { useReducedMotion } from "framer-motion"
import { CircleDashed } from "lucide-react"
import { LinkedListCanvas } from "@/components/structures/linked-list/canvas"
import {
  appendLinkedList,
  checkLinkedListIntegrity,
  createLinkedListState,
  findLinkedListNode,
  formatLinkedListAddress,
  insertLinkedListAfter,
  insertLinkedListBefore,
  isLinkedListEmpty,
  linkedListHeadNode,
  linkedListTailNode,
  prependLinkedList,
  relinkLinkedListPointer,
  removeLinkedListNode,
  repairLinkedListLinks,
  traverseLinkedList,
  type LinkedListFrame,
  type LinkedListPointerRef,
  type LinkedListState,
} from "@/components/structures/linked-list/engine"
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

const IDLE_COMPLEXITY: Complexity = {
  time: "O(1)",
  space: "O(n)",
  note: "Prepend and append are O(1); inserting or removing a known node rewires a constant number of pointers. The list occupies O(n) space.",
}

function parseFiniteNumber(input: string): number | null {
  if (input.trim() === "") {
    return null
  }

  const value = Number(input)

  return Number.isFinite(value) ? value : null
}

export interface LinkedListViewProps {
  active?: boolean
}

export function LinkedListView({ active = true }: LinkedListViewProps) {
  const [initialState] = useState<LinkedListState>(() =>
    createLinkedListState({ initialValues: INITIAL_VALUES }),
  )
  const [valueInput, setValueInput] = useState("42")
  const [targetInput, setTargetInput] = useState(() => initialState.nodes[0]?.id ?? "")
  const [inputError, setInputError] = useState<string | null>(null)
  const [selectedPointer, setSelectedPointer] = useState<LinkedListPointerRef | null>(null)
  const valueInputRef = useRef<HTMLInputElement>(null)
  const reduceMotion = useReducedMotion()
  const player = useTracePlayer<LinkedListState>({ active, autoPlay: !reduceMotion })
  const { appendFrames } = player
  useKeyboardShortcuts({
    active,
    speed: player.speed,
    onTogglePlay: player.togglePlay,
    onStepBack: player.stepBack,
    onStepForward: player.stepForward,
    onReset: handleReset,
    onSpeedChange: player.setSpeed,
  })
  const state = player.frame?.state ?? initialState
  const valueId = useId()
  const targetId = useId()
  const errorId = useId()

  const complexity = player.frame?.complexity ?? IDLE_COMPLEXITY
  const isEmpty = isLinkedListEmpty(state)
  const headNode = linkedListHeadNode(state)
  const tailNode = linkedListTailNode(state)
  const integrity = checkLinkedListIntegrity(state)
  const activeTargetId =
    state.nodes.find((node) => node.id === targetInput)?.id ?? state.nodes[0]?.id ?? ""

  const selectedNode = selectedPointer ? findLinkedListNode(state, selectedPointer.nodeId) : null
  const selectedTargetId =
    selectedNode && selectedPointer
      ? selectedPointer.direction === "next"
        ? selectedNode.nextId
        : selectedNode.prevId
      : null
  const selectedTargetNode = findLinkedListNode(state, selectedTargetId)
  const selectedTargetLabel = selectedTargetNode
    ? String(selectedTargetNode.value)
    : selectedTargetId
      ? "missing"
      : "null"

  const pointers: PointerEntry[] = [
    {
      label: "head",
      value: headNode?.value ?? null,
      tone: headNode ? "pointer" : "default",
    },
    {
      label: "head address",
      value: headNode?.address ?? null,
      tone: headNode ? "pointer" : "default",
    },
    {
      label: "tail",
      value: tailNode?.value ?? null,
      tone: tailNode ? "pointer" : "default",
    },
    {
      label: "tail address",
      value: tailNode?.address ?? null,
      tone: tailNode ? "pointer" : "default",
    },
    { label: "size", value: state.nodes.length },
    {
      label: "integrity",
      value: integrity.status,
      tone: integrity.status === "ok" ? "success" : "danger",
    },
    { label: "next address", value: formatLinkedListAddress(state.nextAddress) },
  ]

  function resetInputError() {
    if (inputError) {
      setInputError(null)
    }
  }

  const runOperation = useCallback(
    (frames: LinkedListFrame[]) => {
      setInputError(null)
      setSelectedPointer(null)
      appendFrames(frames)
    },
    [appendFrames],
  )

  function readValue(): number | null {
    const value = parseFiniteNumber(valueInput)

    if (value === null) {
      setInputError("Enter a finite number for the value.")
      valueInputRef.current?.focus()
      return null
    }

    return value
  }

  function handlePrepend() {
    const value = readValue()

    if (value === null) {
      return
    }

    runOperation(prependLinkedList(state, value))
  }

  function handleAppend() {
    const value = readValue()

    if (value === null) {
      return
    }

    runOperation(appendLinkedList(state, value))
  }

  function handleInsertBefore() {
    const value = readValue()

    if (value === null || activeTargetId === "") {
      return
    }

    runOperation(insertLinkedListBefore(state, activeTargetId, value))
  }

  function handleInsertAfter() {
    const value = readValue()

    if (value === null || activeTargetId === "") {
      return
    }

    runOperation(insertLinkedListAfter(state, activeTargetId, value))
  }

  function handleRemove() {
    if (activeTargetId === "") {
      return
    }

    runOperation(removeLinkedListNode(state, activeTargetId))
  }

  function handleTraverse() {
    runOperation(traverseLinkedList(state))
  }

  const handleRepair = useCallback(() => {
    runOperation(repairLinkedListLinks(state))
  }, [runOperation, state])

  const handlePointerSelect = useCallback((pointer: LinkedListPointerRef) => {
    setSelectedPointer((current) =>
      current?.nodeId === pointer.nodeId && current.direction === pointer.direction
        ? null
        : pointer,
    )
  }, [])

  const handleRelinkTarget = useCallback(
    (nodeId: string) => {
      if (!selectedPointer) {
        return
      }

      runOperation(
        relinkLinkedListPointer(state, selectedPointer.nodeId, selectedPointer.direction, nodeId),
      )
    },
    [runOperation, selectedPointer, state],
  )

  function handleReset() {
    setSelectedPointer(null)
    player.reset()
  }

  return (
    <div className="grid min-w-0 gap-4 p-4 pb-40 sm:p-5 sm:pb-40 lg:grid-cols-[minmax(0,1fr)_20rem] lg:pb-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      {/* The structure panel owns the card surface; keep the stage flush with it. */}
      <StageFrame
        title="Doubly Linked List"
        description="Prepend, append, insert, and remove while the trace explains every pointer rewrite."
        actions={
          <span className="inline-flex items-center rounded-md border border-border/70 bg-background/40 px-2 py-1 font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
            Prev + next
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
        <LinkedListCanvas
          state={state}
          highlights={player.frame?.highlights}
          feedback={player.frame?.feedback}
          selectedPointer={selectedPointer}
          onPointerSelect={handlePointerSelect}
          onRelinkTarget={selectedPointer ? handleRelinkTarget : undefined}
          onRepair={handleRepair}
        />

        {isEmpty ? (
          <div className="flex items-start gap-2 rounded-xl border border-dashed border-border/70 bg-background/20 px-3 py-2.5">
            <CircleDashed
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            />
            <div className="min-w-0">
              <p className="text-xs font-medium">The linked list is empty.</p>
              <p className="mt-0.5 text-[11px] text-pretty text-muted-foreground">
                Prepend or append a value to create the head. Insert and remove need at least one
                node.
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
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex w-32 flex-col gap-1">
                <label
                  htmlFor={valueId}
                  className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase"
                >
                  Value
                </label>
                <Input
                  ref={valueInputRef}
                  id={valueId}
                  name="linked-list-value"
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

              <div className="flex min-w-40 flex-1 flex-col gap-1">
                <label
                  htmlFor={targetId}
                  className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase"
                >
                  Target node
                </label>
                <select
                  id={targetId}
                  name="linked-list-target"
                  value={activeTargetId}
                  disabled={isEmpty}
                  onChange={(event) => {
                    setTargetInput(event.target.value)
                    resetInputError()
                  }}
                  className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 font-mono text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
                >
                  {isEmpty ? (
                    <option value="" className="bg-panel text-foreground">
                      No nodes
                    </option>
                  ) : (
                    state.nodes.map((node) => (
                      <option key={node.id} value={node.id} className="bg-panel text-foreground">
                        {node.value} · {node.address}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {inputError ? (
              <p id={errorId} role="alert" className="mt-2 text-[11px] text-destructive">
                {inputError}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-1.5">
              <Button type="button" size="sm" onClick={handlePrepend}>
                Prepend
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handleAppend}>
                Append
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleInsertBefore}
                disabled={isEmpty}
              >
                Insert before
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleInsertAfter}
                disabled={isEmpty}
              >
                Insert after
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={handleRemove}
                disabled={isEmpty}
              >
                Remove
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handleTraverse}>
                Traverse
              </Button>
            </div>

            <p className="mt-2 text-[11px] text-pretty text-muted-foreground">
              Insert and remove act on the target node. Select a pointer dot on the canvas to relink
              it.
            </p>
          </div>
        </div>
      </StageFrame>

      <InspectorPanel label="Linked list inspector">
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

        <InspectorSection title="Addresses">
          {isEmpty ? (
            <p className="text-xs text-pretty text-muted-foreground">
              No nodes to address yet. New nodes receive the next free address.
            </p>
          ) : (
            <dl className="grid gap-1.5">
              {state.nodes.map((node) => (
                <div
                  key={node.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/30 px-2.5 py-1.5"
                >
                  <dt className="font-mono text-[11px] text-muted-foreground">node {node.value}</dt>
                  <dd className="font-mono text-[11px] text-foreground tabular-nums">
                    {node.address}
                  </dd>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border/60 px-2.5 py-1.5">
                <dt className="font-mono text-[11px] text-muted-foreground">next free</dt>
                <dd className="font-mono text-[11px] text-muted-foreground tabular-nums">
                  {formatLinkedListAddress(state.nextAddress)}
                </dd>
              </div>
            </dl>
          )}
        </InspectorSection>

        <InspectorSection title="Pointer surgery">
          {selectedPointer && selectedNode ? (
            <div className="flex flex-col gap-2">
              <p className="font-mono text-xs text-foreground">
                {selectedNode.value}.{selectedPointer.direction} → {selectedTargetLabel}
              </p>
              <p className="text-xs text-pretty text-muted-foreground">
                Click a relink target on a node card, or clear the selection.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setSelectedPointer(null)}
                className="self-start"
              >
                Clear selection
              </Button>
            </div>
          ) : (
            <p className="text-xs text-pretty text-muted-foreground">
              Select a pointer dot on the canvas, then choose a node to relink it to. The repair
              action appears when links break.
            </p>
          )}
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
            onReset={handleReset}
            onSpeedChange={player.setSpeed}
          />
        </PlaybackDock>
      </InspectorPanel>
    </div>
  )
}
