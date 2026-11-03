import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { StageFrame } from "@/components/structures/shared/stage-frame"

describe("StageFrame", () => {
  it("renders the stage heading, description, actions, content, and footer", () => {
    render(
      <StageFrame
        title="Array stage"
        description="Watch values shift between slots."
        actions={<button type="button">Append</button>}
        footer={<span>Capacity 8</span>}
      >
        <p>Canvas content</p>
      </StageFrame>,
    )

    expect(screen.getByRole("region", { name: "Array stage" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Array stage" })).toBeInTheDocument()
    expect(screen.getByText("Watch values shift between slots.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Append" })).toBeInTheDocument()
    expect(screen.getByText("Canvas content")).toBeInTheDocument()
    expect(screen.getByText("Capacity 8")).toBeInTheDocument()
  })

  it("omits optional regions when they are not provided", () => {
    render(
      <StageFrame title="Stack stage">
        <p>Canvas content</p>
      </StageFrame>,
    )

    expect(screen.getByRole("region", { name: "Stack stage" })).toBeInTheDocument()
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})
