import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { PlaybackControls } from "@/components/structures/shared/playback-controls"

function renderControls(overrides: Partial<React.ComponentProps<typeof PlaybackControls>> = {}) {
  const props: React.ComponentProps<typeof PlaybackControls> = {
    status: "paused",
    speed: 1,
    cursor: 1,
    total: 3,
    onTogglePlay: vi.fn(),
    onStepBack: vi.fn(),
    onStepForward: vi.fn(),
    onReset: vi.fn(),
    onSpeedChange: vi.fn(),
    ...overrides,
  }

  render(<PlaybackControls {...props} />)

  return props
}

describe("PlaybackControls", () => {
  it("renders playback actions and the current step", () => {
    renderControls()

    expect(screen.getByRole("button", { name: "Step back" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Play" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Step forward" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Reset trace" })).toBeEnabled()
    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument()
  })

  it("calls playback handlers", () => {
    const props = renderControls()

    fireEvent.click(screen.getByRole("button", { name: "Step back" }))
    fireEvent.click(screen.getByRole("button", { name: "Play" }))
    fireEvent.click(screen.getByRole("button", { name: "Step forward" }))
    fireEvent.click(screen.getByRole("button", { name: "Reset trace" }))

    expect(props.onStepBack).toHaveBeenCalledOnce()
    expect(props.onTogglePlay).toHaveBeenCalledOnce()
    expect(props.onStepForward).toHaveBeenCalledOnce()
    expect(props.onReset).toHaveBeenCalledOnce()
  })

  it("shows a pause action while playing", () => {
    renderControls({ status: "playing" })

    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument()
  })

  it("disables boundary actions", () => {
    renderControls({ cursor: 0 })

    expect(screen.getByRole("button", { name: "Step back" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Step forward" })).toBeEnabled()
  })

  it("disables forward and reset actions at the end of a trace", () => {
    renderControls({ cursor: 2 })

    expect(screen.getByRole("button", { name: "Step forward" })).toBeDisabled()
  })

  it("disables playback when there are no frames", () => {
    renderControls({ cursor: 0, total: 0 })

    expect(screen.getByRole("button", { name: "Play" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Step back" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Step forward" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Reset trace" })).toBeDisabled()
    expect(screen.getByText("No steps")).toBeInTheDocument()
  })

  it("changes the playback speed", () => {
    const props = renderControls()

    expect(screen.getByRole("button", { name: "1×" })).toHaveAttribute("aria-pressed", "true")

    fireEvent.click(screen.getByRole("button", { name: "2×" }))

    expect(props.onSpeedChange).toHaveBeenCalledWith(2)
  })

  it("exposes keyboard shortcuts on the playback actions", () => {
    renderControls()

    expect(screen.getByRole("button", { name: "Step back" })).toHaveAttribute(
      "aria-keyshortcuts",
      "ArrowLeft",
    )
    expect(screen.getByRole("button", { name: "Play" })).toHaveAttribute(
      "aria-keyshortcuts",
      "Space",
    )
    expect(screen.getByRole("button", { name: "Step forward" })).toHaveAttribute(
      "aria-keyshortcuts",
      "ArrowRight",
    )
    expect(screen.getByRole("button", { name: "Reset trace" })).toHaveAttribute(
      "aria-keyshortcuts",
      "Home",
    )
    expect(screen.getByText(/Space play\/pause/)).toBeInTheDocument()
  })
})
