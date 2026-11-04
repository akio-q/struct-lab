import { describe, expect, it } from "vitest"
import {
  mergeHighlightRole,
  resolveSlotRoles,
} from "@/components/structures/shared/highlight-roles"

const state = {
  capacity: 4,
  items: [{ id: "a" }, { id: "b" }],
}

function slotId(index: number): string {
  return `slot-${index}`
}

describe("mergeHighlightRole", () => {
  it("keeps the strongest role", () => {
    expect(mergeHighlightRole(undefined, "active")).toBe("active")
    expect(mergeHighlightRole("remove", "insert")).toBe("remove")
    expect(mergeHighlightRole("source", "target")).toBe("target")
  })
})

describe("resolveSlotRoles", () => {
  it("maps item highlights to their slot index", () => {
    const roles = resolveSlotRoles(state, [{ target: "item", id: "b", role: "insert" }], slotId)

    expect(roles.get(1)).toBe("insert")
    expect(roles.size).toBe(1)
  })

  it("maps slot highlights and lets them override weaker item roles", () => {
    const roles = resolveSlotRoles(
      state,
      [
        { target: "item", id: "a", role: "source" },
        { target: "slot", id: "slot-0", role: "remove" },
      ],
      slotId,
    )

    expect(roles.get(0)).toBe("remove")
  })

  it("lets a stronger item role override a weaker slot role", () => {
    const roles = resolveSlotRoles(
      state,
      [
        { target: "slot", id: "slot-1", role: "source" },
        { target: "item", id: "b", role: "remove" },
      ],
      slotId,
    )

    expect(roles.get(1)).toBe("remove")
  })

  it("ignores unknown items and slots", () => {
    const roles = resolveSlotRoles(
      state,
      [
        { target: "item", id: "missing", role: "active" },
        { target: "slot", id: "slot-9", role: "active" },
      ],
      slotId,
    )

    expect(roles.size).toBe(0)
  })
})
