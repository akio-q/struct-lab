import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { StructureTabs } from "@/components/shell/structure-tabs"
import { STRUCTURE_IDS } from "@/lib/structures/types"

describe("StructureTabs", () => {
  it("renders every structure as a tab", () => {
    render(<StructureTabs value="array" onValueChange={vi.fn()} />)

    const tabs = screen.getAllByRole("tab")

    expect(tabs).toHaveLength(STRUCTURE_IDS.length)
    expect(tabs.map((tab) => tab.id)).toEqual(STRUCTURE_IDS.map((id) => `structure-tab-${id}`))
  })

  it("exposes the active tab and links each tab to its panel", () => {
    render(<StructureTabs value="queue" onValueChange={vi.fn()} />)

    const tabs = screen.getAllByRole("tab")

    for (const [index, id] of STRUCTURE_IDS.entries()) {
      expect(tabs[index]).toHaveAttribute("aria-controls", `structure-panel-${id}`)
      expect(tabs[index]).toHaveAttribute("aria-selected", String(id === "queue"))
      expect(tabs[index]).toHaveAttribute("tabindex", id === "queue" ? "0" : "-1")
    }
  })

  it("requests a structure change when a tab is clicked", () => {
    const onValueChange = vi.fn()

    render(<StructureTabs value="array" onValueChange={onValueChange} />)

    fireEvent.click(screen.getByRole("tab", { name: "Stack" }))

    expect(onValueChange).toHaveBeenCalledWith("stack")
  })

  it("moves focus and selection with arrow keys", () => {
    const onValueChange = vi.fn()

    render(<StructureTabs value="array" onValueChange={onValueChange} />)

    const tabs = screen.getAllByRole("tab")

    fireEvent.keyDown(tabs[0], { key: "ArrowRight" })

    expect(onValueChange).toHaveBeenLastCalledWith("stack")
    expect(tabs[1]).toHaveFocus()

    fireEvent.keyDown(tabs[1], { key: "ArrowLeft" })

    expect(onValueChange).toHaveBeenLastCalledWith("array")
    expect(tabs[0]).toHaveFocus()
  })

  it("wraps focus at both ends", () => {
    const onValueChange = vi.fn()

    render(<StructureTabs value="array" onValueChange={onValueChange} />)

    const tabs = screen.getAllByRole("tab")

    fireEvent.keyDown(tabs[0], { key: "ArrowLeft" })

    expect(onValueChange).toHaveBeenLastCalledWith("linked-list")
    expect(tabs.at(-1)).toHaveFocus()

    fireEvent.keyDown(tabs.at(-1)!, { key: "ArrowRight" })

    expect(onValueChange).toHaveBeenLastCalledWith("array")
    expect(tabs[0]).toHaveFocus()
  })

  it("supports Home and End keys", () => {
    const onValueChange = vi.fn()

    render(<StructureTabs value="deque" onValueChange={onValueChange} />)

    const tabs = screen.getAllByRole("tab")

    fireEvent.keyDown(tabs[3], { key: "Home" })

    expect(onValueChange).toHaveBeenLastCalledWith("array")
    expect(tabs[0]).toHaveFocus()

    fireEvent.keyDown(tabs[0], { key: "End" })

    expect(onValueChange).toHaveBeenLastCalledWith("linked-list")
    expect(tabs.at(-1)).toHaveFocus()
  })

  it("ignores unrelated keys", () => {
    const onValueChange = vi.fn()

    render(<StructureTabs value="array" onValueChange={onValueChange} />)

    fireEvent.keyDown(screen.getAllByRole("tab")[0], { key: "Enter" })

    expect(onValueChange).not.toHaveBeenCalled()
  })
})
