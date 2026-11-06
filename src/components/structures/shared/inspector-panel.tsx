import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface InspectorPanelProps {
  label: string
  children: ReactNode
  className?: string
}

/**
 * Inspector column. On desktop it sits beside the stage; below `lg` it becomes
 * a full-width stack under the canvas, with a visible heading so the section is
 * easy to find while scrolling.
 */
export function InspectorPanel({ label, children, className }: InspectorPanelProps) {
  return (
    <aside aria-label={label} className={cn("flex min-w-0 flex-col gap-3", className)}>
      <h2 className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase lg:hidden">
        Inspector
      </h2>
      {children}
    </aside>
  )
}

export interface InspectorSectionProps {
  title: string
  children: ReactNode
  className?: string
}

export function InspectorSection({ title, children, className }: InspectorSectionProps) {
  return (
    <section className={cn("rounded-xl border border-border/70 bg-background/30 p-3", className)}>
      <h3 className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
        {title}
      </h3>
      <div className="mt-2">{children}</div>
    </section>
  )
}
