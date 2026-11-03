import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { PointerInspector } from "@/components/structures/shared/pointer-inspector"

describe("PointerInspector", () => {
  it("renders pointer labels, values, and nulls", () => {
    render(
      <PointerInspector
        pointers={[
          { label: "head", value: "node-1", tone: "pointer" },
          { label: "tail", value: "node-3" },
          { label: "next", value: null },
          { label: "length", value: 3, tone: "success" },
        ]}
      />,
    )

    expect(screen.getByText("head")).toBeInTheDocument()
    expect(screen.getByText("node-1")).toBeInTheDocument()
    expect(screen.getByText("tail")).toBeInTheDocument()
    expect(screen.getByText("node-3")).toBeInTheDocument()
    expect(screen.getByText("next")).toBeInTheDocument()
    expect(screen.getByText("null")).toBeInTheDocument()
    expect(screen.getByText("length")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
  })

  it("renders an empty state when no pointers exist", () => {
    render(<PointerInspector pointers={[]} />)

    expect(screen.getByText("No pointer state yet.")).toBeInTheDocument()
  })
})
