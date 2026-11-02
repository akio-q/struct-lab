import { describe, expect, it } from "vitest"
import {
  DEFAULT_STRUCTURE_ID,
  getStructureMeta,
  isStructureId,
  resolveStructureId,
  structureHref,
  structureList,
  structureRegistry,
} from "@/lib/structures/registry"
import { STRUCTURE_IDS } from "@/lib/structures/types"

describe("structure registry", () => {
  it("registers every structure in display order", () => {
    expect(structureList.map((structure) => structure.id)).toEqual([...STRUCTURE_IDS])
    expect(Object.keys(structureRegistry)).toHaveLength(STRUCTURE_IDS.length)
  })

  it("exposes metadata for every structure", () => {
    for (const id of STRUCTURE_IDS) {
      const meta = getStructureMeta(id)

      expect(meta.id).toBe(id)
      expect(meta.label).not.toHaveLength(0)
      expect(meta.shortLabel).not.toHaveLength(0)
      expect(meta.description).not.toHaveLength(0)
    }
  })

  it("recognizes valid structure ids", () => {
    for (const id of STRUCTURE_IDS) {
      expect(isStructureId(id)).toBe(true)
    }

    expect(isStructureId("heap")).toBe(false)
    expect(isStructureId("")).toBe(false)
    expect(isStructureId(null)).toBe(false)
    expect(isStructureId(42)).toBe(false)
  })

  it("falls back to the default structure for invalid values", () => {
    expect(DEFAULT_STRUCTURE_ID).toBe("array")
    expect(resolveStructureId("stack")).toBe("stack")
    expect(resolveStructureId("linked-list")).toBe("linked-list")
    expect(resolveStructureId("tree")).toBe(DEFAULT_STRUCTURE_ID)
    expect(resolveStructureId(null)).toBe(DEFAULT_STRUCTURE_ID)
    expect(resolveStructureId(undefined)).toBe(DEFAULT_STRUCTURE_ID)
  })

  it("builds canonical structure links", () => {
    expect(structureHref("array")).toBe("/?structure=array")
    expect(structureHref("linked-list")).toBe("/?structure=linked-list")
  })
})
