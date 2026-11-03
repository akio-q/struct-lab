import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { ComplexityBadge } from "@/components/structures/shared/complexity-badge"

describe("ComplexityBadge", () => {
  it("renders time, space, and the explanatory note", () => {
    render(
      <ComplexityBadge
        complexity={{ time: "O(1)", space: "O(n)", note: "Indexed access is constant time." }}
      />,
    )

    expect(screen.getByText("O(1)")).toBeInTheDocument()
    expect(screen.getByText("O(n)")).toBeInTheDocument()
    expect(screen.getByText("Indexed access is constant time.")).toBeInTheDocument()
  })
})
