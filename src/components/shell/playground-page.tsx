"use client"

import { AppHeader } from "@/components/shell/app-header"
import { StructureRenderer } from "@/components/shell/structure-renderer"
import { useStructureRoute } from "@/hooks/use-structure-route"

export function PlaygroundPage() {
  const { structureId, setStructureId } = useStructureRoute()

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader structureId={structureId} onStructureChange={setStructureId} />
      <main
        id="main-content"
        className="mx-auto flex w-full max-w-[1440px] flex-1 scroll-mt-16 flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:gap-6 lg:py-8"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-balance sm:text-3xl">
            Structure Playground
          </h1>
          <p className="max-w-sm text-sm text-pretty text-muted-foreground">
            Step through every operation frame by frame.
          </p>
        </div>
        <StructureRenderer activeStructureId={structureId} />
      </main>
    </div>
  )
}
