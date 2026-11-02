import type { StructureMeta } from "@/lib/structures/registry"

export interface StructurePlaceholderProps {
  structure: StructureMeta
}

export function StructurePlaceholder({ structure }: StructurePlaceholderProps) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-5 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-2">
        <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          Playground
        </p>
        <h2 className="text-2xl font-semibold tracking-[-0.02em]">{structure.label}</h2>
        <p className="max-w-prose text-sm leading-6 text-muted-foreground">
          {structure.description}
        </p>
      </div>

      <div className="flex min-h-[320px] flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background/30 px-6 py-12 text-center">
        <p className="text-sm font-medium">Canvas coming next</p>
        <p className="max-w-sm text-sm text-pretty text-muted-foreground">
          The {structure.label} engine, canvas, and inspector arrive in the next phases.
        </p>
      </div>
    </div>
  )
}
