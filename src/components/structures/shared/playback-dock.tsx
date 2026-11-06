import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface PlaybackDockProps {
  children: ReactNode
  className?: string
}

/**
 * Playback wrapper. On desktop it is the last inspector card; below `lg` it is
 * a fixed bottom dock so transport controls stay reachable while the canvas
 * and operation panel scroll.
 */
export function PlaybackDock({ children, className }: PlaybackDockProps) {
  return (
    <section
      aria-label="Playback"
      className={cn(
        "rounded-xl border border-border/70 bg-background/30 p-3",
        "max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-30 max-lg:rounded-none max-lg:border-x-0 max-lg:border-b-0 max-lg:bg-background/95 max-lg:px-4 max-lg:pt-2 max-lg:pb-[calc(0.75rem_+_env(safe-area-inset-bottom))] max-lg:shadow-[0_-16px_40px_rgba(0,0,0,0.45)] max-lg:backdrop-blur-xl",
        className,
      )}
    >
      <h3 className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase max-lg:sr-only">
        Playback
      </h3>
      <div className="mt-2 max-lg:mx-auto max-lg:mt-0 max-lg:w-full max-lg:max-w-md">
        {children}
      </div>
    </section>
  )
}
