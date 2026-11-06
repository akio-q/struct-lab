"use client"

import { Pause, Play, RotateCcw, StepBack, StepForward } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PLAYBACK_SPEEDS, type PlaybackStatus, type Speed } from "@/lib/structures/types"
import { cn } from "@/lib/utils"

export interface PlaybackControlsProps {
  status: PlaybackStatus
  speed: Speed
  cursor: number
  total: number
  onTogglePlay: () => void
  onStepBack: () => void
  onStepForward: () => void
  onReset: () => void
  onSpeedChange: (speed: Speed) => void
  className?: string
}

export function PlaybackControls({
  status,
  speed,
  cursor,
  total,
  onTogglePlay,
  onStepBack,
  onStepForward,
  onReset,
  onSpeedChange,
  className,
}: PlaybackControlsProps) {
  const hasFrames = total > 0
  const canStepBack = hasFrames && cursor > 0
  const canStepForward = hasFrames && cursor < total - 1
  const isPlaying = status === "playing"
  const currentStep = hasFrames ? Math.min(Math.max(cursor, 0), total - 1) + 1 : 0

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onStepBack}
          disabled={!canStepBack}
          aria-label="Step back"
          aria-keyshortcuts="ArrowLeft"
          title="Step back (←)"
        >
          <StepBack aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={onTogglePlay}
          disabled={!hasFrames}
          aria-label={isPlaying ? "Pause" : "Play"}
          aria-keyshortcuts="Space"
          title={isPlaying ? "Pause (Space)" : "Play (Space)"}
        >
          {isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onStepForward}
          disabled={!canStepForward}
          aria-label="Step forward"
          aria-keyshortcuts="ArrowRight"
          title="Step forward (→)"
        >
          <StepForward aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onReset}
          disabled={!hasFrames}
          aria-label="Reset trace"
          aria-keyshortcuts="Home"
          title="Reset trace (Home)"
        >
          <RotateCcw aria-hidden="true" />
        </Button>

        <span
          className="ml-auto font-mono text-[11px] text-muted-foreground tabular-nums"
          aria-live="polite"
          aria-atomic="true"
        >
          {hasFrames ? `Step ${currentStep} of ${total}` : "No steps"}
        </span>
      </div>

      <div className="flex items-center gap-1" role="group" aria-label="Playback speed">
        {PLAYBACK_SPEEDS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onSpeedChange(value)}
            aria-pressed={speed === value}
            className={cn(
              "h-6 touch-manipulation rounded-md border px-2 font-mono text-[10px] tabular-nums transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none",
              speed === value
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-transparent text-muted-foreground hover:border-border hover:bg-white/[0.03] hover:text-foreground",
            )}
          >
            {value}×
          </button>
        ))}
        <span className="ml-auto text-[10px] text-muted-foreground">Speed</span>
      </div>

      <p className="text-[10px] leading-relaxed text-pretty text-muted-foreground">
        Space play/pause · ← → step · Home reset · [ ] speed
      </p>
    </div>
  )
}
