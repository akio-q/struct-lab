import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { StructureRenderer } from "@/components/shell/structure-renderer"
import { STRUCTURE_IDS } from "@/lib/structures/types"

describe("StructureRenderer", () => {
  it("mounts a panel for every structure", () => {
    render(<StructureRenderer activeStructureId="array" />)

    const panels = screen.getAllByRole("tabpanel", { hidden: true })

    expect(panels).toHaveLength(STRUCTURE_IDS.length)
    expect(panels.map((panel) => panel.id)).toEqual(
      STRUCTURE_IDS.map((id) => `structure-panel-${id}`),
    )
  })

  it("keeps only the active panel available to assistive technology", () => {
    render(<StructureRenderer activeStructureId="queue" />)

    for (const id of STRUCTURE_IDS) {
      const panel = document.getElementById(`structure-panel-${id}`)

      expect(panel).not.toBeNull()

      if (id === "queue") {
        expect(panel).not.toHaveAttribute("aria-hidden")
        expect(panel).not.toHaveAttribute("inert")
        expect(panel).toHaveAttribute("tabindex", "0")
      } else {
        expect(panel).toHaveAttribute("aria-hidden", "true")
        expect(panel).toHaveAttribute("inert")
        expect(panel).not.toHaveAttribute("tabindex")
      }
    }
  })

  it("renders the active structure metadata", () => {
    render(<StructureRenderer activeStructureId="linked-list" />)

    expect(screen.getByRole("heading", { name: "Doubly Linked List" })).toBeVisible()
  })

  it("mounts the array playground in the array panel", () => {
    render(<StructureRenderer activeStructureId="array" />)

    expect(screen.getByRole("heading", { name: "Array" })).toBeVisible()
    expect(screen.getByRole("button", { name: "Append" })).toBeVisible()
    expect(screen.getByTestId("array-capacity")).toBeVisible()
  })
})
