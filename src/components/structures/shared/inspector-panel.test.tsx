import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { InspectorPanel, InspectorSection } from "@/components/structures/shared/inspector-panel"

describe("InspectorPanel", () => {
  it("labels the inspector and renders its sections", () => {
    render(
      <InspectorPanel label="Stack inspector">
        <InspectorSection title="Playback">
          <span>Controls</span>
        </InspectorSection>
      </InspectorPanel>,
    )

    expect(screen.getByRole("complementary", { name: "Stack inspector" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Inspector" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 3, name: "Playback" })).toBeInTheDocument()
    expect(screen.getByText("Controls")).toBeInTheDocument()
  })
})
