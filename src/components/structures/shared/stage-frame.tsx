"use client"

import { useId, type ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface StageFrameProps {
  title: string
  description?: string
  actions?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}

export function StageFrame({
  title,
  description,
  actions,
  footer,
  children,
  className,
  contentClassName,
}: StageFrameProps) {
  const titleId = useId()

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/70 bg-panel/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 id={titleId} className="text-sm font-semibold tracking-[-0.01em] text-balance">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-xs text-pretty text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-1.5">{actions}</div> : null}
      </header>

      <div
        className={cn("relative flex min-h-[320px] flex-1 flex-col p-4 sm:p-5", contentClassName)}
      >
        {children}
      </div>

      {footer ? (
        <div className="border-t border-border/60 px-4 py-2.5 sm:px-5">{footer}</div>
      ) : null}
    </section>
  )
}
