import type { PointerEntry, PointerTone } from "@/lib/structures/types"
import { cn } from "@/lib/utils"

export interface PointerInspectorProps {
  pointers: readonly PointerEntry[]
  className?: string
}

const toneClasses: Record<PointerTone, string> = {
  default: "text-foreground",
  pointer: "text-pointer",
  success: "text-success",
  danger: "text-destructive",
}

export function PointerInspector({ pointers, className }: PointerInspectorProps) {
  if (pointers.length === 0) {
    return <p className={cn("text-xs text-muted-foreground", className)}>No pointer state yet.</p>
  }

  return (
    <dl className={cn("grid gap-1.5", className)}>
      {pointers.map((pointer) => (
        <div
          key={pointer.label}
          className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/30 px-2.5 py-1.5"
        >
          <dt className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
            {pointer.label}
          </dt>
          <dd
            className={cn("font-mono text-xs tabular-nums", toneClasses[pointer.tone ?? "default"])}
          >
            {pointer.value === null ? "null" : pointer.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
