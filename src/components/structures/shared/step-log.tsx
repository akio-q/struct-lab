import { Circle, CircleCheck, CircleX, TriangleAlert, type LucideIcon } from "lucide-react"
import type { Feedback, StepLogEntry } from "@/lib/structures/types"
import { cn } from "@/lib/utils"

export interface StepLogProps {
  entries: readonly StepLogEntry[]
  cursor: number
  onSelect?: (index: number) => void
  className?: string
}

const feedbackMeta: Record<Feedback, { label: string; icon: LucideIcon; className: string }> = {
  neutral: { label: "Neutral", icon: Circle, className: "text-muted-foreground" },
  success: { label: "Success", icon: CircleCheck, className: "text-success" },
  warning: { label: "Warning", icon: TriangleAlert, className: "text-pointer" },
  error: { label: "Error", icon: CircleX, className: "text-destructive" },
}

export function StepLog({ entries, cursor, onSelect, className }: StepLogProps) {
  if (entries.length === 0) {
    return (
      <p className={cn("text-xs text-pretty text-muted-foreground", className)}>
        No steps yet. Run an operation to build a trace.
      </p>
    )
  }

  return (
    <ol className={cn("flex flex-col gap-1", className)}>
      {entries.map((entry, index) => {
        const isActive = index === cursor
        const meta = feedbackMeta[entry.feedback]
        const Icon = meta.icon
        const rowClassName = cn(
          "flex w-full items-start gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors",
          isActive
            ? "border-primary/30 bg-primary/10"
            : "border-transparent hover:border-border hover:bg-white/[0.03]",
          onSelect && "focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none",
        )

        const content = (
          <>
            <span className="mt-0.5 font-mono text-[10px] text-muted-foreground tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="truncate text-xs font-medium">{entry.operation}</span>
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                  {entry.phase}
                </span>
                <Icon
                  aria-hidden="true"
                  className={cn("ml-auto size-3 shrink-0", meta.className)}
                />
                <span className="sr-only">{meta.label}</span>
              </span>
              <span className="mt-0.5 line-clamp-2 block text-[11px] text-muted-foreground">
                {entry.detail}
              </span>
            </span>
          </>
        )

        return (
          <li key={entry.id}>
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(index)}
                aria-current={isActive ? "step" : undefined}
                className={rowClassName}
              >
                {content}
              </button>
            ) : (
              <div aria-current={isActive ? "step" : undefined} className={rowClassName}>
                {content}
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
