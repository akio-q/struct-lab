import { ArrayView } from "@/components/structures/array-view"
import { QueueView } from "@/components/structures/queue-view"
import { StackView } from "@/components/structures/stack-view"
import { structureList } from "@/lib/structures/registry"
import type { StructureId } from "@/lib/structures/types"
import { cn } from "@/lib/utils"
import { StructurePlaceholder } from "./structure-placeholder"

export interface StructureRendererProps {
  activeStructureId: StructureId
}

export function StructureRenderer({ activeStructureId }: StructureRendererProps) {
  return (
    <div className="relative flex flex-1 flex-col">
      {structureList.map((structure) => {
        const isActive = structure.id === activeStructureId

        return (
          <section
            key={structure.id}
            id={`structure-panel-${structure.id}`}
            role="tabpanel"
            aria-labelledby={`structure-tab-${structure.id}`}
            aria-hidden={isActive ? undefined : true}
            inert={isActive ? undefined : true}
            tabIndex={isActive ? 0 : undefined}
            className={cn(
              "flex flex-col rounded-2xl border border-border/70 bg-panel/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
              "focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none",
              isActive ? "relative flex-1" : "pointer-events-none absolute inset-0 opacity-0",
            )}
          >
            {structure.id === "array" ? (
              <ArrayView active={isActive} />
            ) : structure.id === "stack" ? (
              <StackView active={isActive} />
            ) : structure.id === "queue" ? (
              <QueueView active={isActive} />
            ) : (
              <StructurePlaceholder structure={structure} />
            )}
          </section>
        )
      })}
    </div>
  )
}
