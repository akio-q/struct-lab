"use client"

import Link from "next/link"
import { Boxes, CodeXml } from "lucide-react"
import { StructureTabs } from "@/components/shell/structure-tabs"
import { siteConfig } from "@/lib/site"
import type { StructureId } from "@/lib/structures/types"

export interface AppHeaderProps {
  structureId: StructureId
  onStructureChange: (value: StructureId) => void
}

export function AppHeader({ structureId, onStructureChange }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center gap-3 px-4 sm:gap-5 sm:px-6">
        <Link
          href="/"
          className="group flex shrink-0 touch-manipulation items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none pointer-coarse:min-h-11"
        >
          <span className="flex size-7 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors group-hover:border-primary/40 group-hover:bg-primary/15">
            <Boxes aria-hidden="true" className="size-4" />
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.01em]">{siteConfig.name}</span>
        </Link>

        <span aria-hidden="true" className="hidden h-5 w-px bg-border sm:block" />

        <StructureTabs
          value={structureId}
          onValueChange={onStructureChange}
          className="min-w-0 [scrollbar-width:none] overflow-x-auto overscroll-x-contain [&::-webkit-scrollbar]:hidden"
        />

        <a
          href={siteConfig.links.github}
          target="_blank"
          rel="noreferrer"
          aria-label="View StructLab on GitHub (opens in a new tab)"
          className="ml-auto flex size-8 shrink-0 touch-manipulation items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none pointer-coarse:size-11"
        >
          <CodeXml aria-hidden="true" className="size-4" />
        </a>
      </div>
    </header>
  )
}
