import type { Complexity } from "@/lib/structures/types"
import { cn } from "@/lib/utils"

export interface ComplexityBadgeProps {
  complexity: Complexity
  className?: string
}

export function ComplexityBadge({ complexity, className }: ComplexityBadgeProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/10 px-2 py-1 font-mono text-[11px]">
          <span className="text-primary">time</span>
          <span className="font-semibold text-primary">{complexity.time}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background/40 px-2 py-1 font-mono text-[11px]">
          <span className="text-muted-foreground">space</span>
          <span className="font-semibold text-foreground">{complexity.space}</span>
        </span>
      </div>
      <p className="text-xs text-pretty text-muted-foreground">{complexity.note}</p>
    </div>
  )
}
