import type { Highlight, HighlightRole } from "@/lib/structures/types"

export const highlightRolePriority: Record<HighlightRole, number> = {
  remove: 6,
  insert: 5,
  active: 4,
  target: 3,
  source: 2,
  pointer: 1,
}

export interface HighlightRoleMeta {
  label: string
  slotClassName: string
  textClassName: string
}

export const highlightRoleMeta: Record<HighlightRole, HighlightRoleMeta> = {
  active: {
    label: "now",
    slotClassName: "border-primary/60 bg-primary/10",
    textClassName: "text-primary",
  },
  source: {
    label: "src",
    slotClassName: "border-pointer/60 bg-pointer/10",
    textClassName: "text-pointer",
  },
  target: {
    label: "dst",
    slotClassName: "border-success/60 bg-success/10",
    textClassName: "text-success",
  },
  insert: {
    label: "new",
    slotClassName: "border-success/70 bg-success/10",
    textClassName: "text-success",
  },
  remove: {
    label: "out",
    slotClassName: "border-destructive/70 bg-destructive/10",
    textClassName: "text-destructive",
  },
  pointer: {
    label: "ptr",
    slotClassName: "border-pointer/60 bg-pointer/10",
    textClassName: "text-pointer",
  },
}

export function mergeHighlightRole(
  current: HighlightRole | undefined,
  next: HighlightRole,
): HighlightRole {
  if (!current) {
    return next
  }

  return highlightRolePriority[next] > highlightRolePriority[current] ? next : current
}

export interface SlotRoleState {
  capacity: number
  items: readonly { id: string }[]
}

/**
 * Resolves item and slot highlights into one role per slot index. Slot
 * highlights win over item highlights when both target the same index.
 */
export function resolveSlotRoles(
  state: SlotRoleState,
  highlights: readonly Highlight[],
  slotId: (index: number) => string,
): Map<number, HighlightRole> {
  const roles = new Map<number, HighlightRole>()
  const itemRoles = new Map<string, HighlightRole>()
  const indexBySlotId = new Map<string, number>()

  for (let index = 0; index < state.capacity; index += 1) {
    indexBySlotId.set(slotId(index), index)
  }

  for (const highlight of highlights) {
    if (highlight.target === "item") {
      itemRoles.set(highlight.id, mergeHighlightRole(itemRoles.get(highlight.id), highlight.role))
      continue
    }

    if (highlight.target === "slot") {
      const index = indexBySlotId.get(highlight.id)

      if (index !== undefined) {
        roles.set(index, mergeHighlightRole(roles.get(index), highlight.role))
      }
    }
  }

  for (const [index, item] of state.items.entries()) {
    const role = itemRoles.get(item.id)

    if (role) {
      roles.set(index, mergeHighlightRole(roles.get(index), role))
    }
  }

  return roles
}
