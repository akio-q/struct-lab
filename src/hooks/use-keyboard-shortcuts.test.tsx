import { fireEvent, render, renderHook, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { useKeyboardShortcuts, type KeyboardShortcutOptions } from "@/hooks/use-keyboard-shortcuts"

function createOptions(overrides: Partial<KeyboardShortcutOptions> = {}): KeyboardShortcutOptions {
  return {
    speed: 1,
    onTogglePlay: vi.fn(),
    onStepBack: vi.fn(),
    onStepForward: vi.fn(),
    onReset: vi.fn(),
    onSpeedChange: vi.fn(),
    ...overrides,
  }
}

function renderShortcuts(overrides: Partial<KeyboardShortcutOptions> = {}) {
  const options = createOptions(overrides)

  renderHook(() => useKeyboardShortcuts(options))

  return options
}

describe("useKeyboardShortcuts", () => {
  it("toggles playback with Space", () => {
    const options = renderShortcuts()

    fireEvent.keyDown(window, { code: "Space", key: " " })

    expect(options.onTogglePlay).toHaveBeenCalledOnce()
  })

  it("steps backward and forward with the arrow keys", () => {
    const options = renderShortcuts()

    fireEvent.keyDown(window, { key: "ArrowLeft" })
    fireEvent.keyDown(window, { key: "ArrowRight" })

    expect(options.onStepBack).toHaveBeenCalledOnce()
    expect(options.onStepForward).toHaveBeenCalledOnce()
  })

  it("resets the trace with Home", () => {
    const options = renderShortcuts()

    fireEvent.keyDown(window, { key: "Home" })

    expect(options.onReset).toHaveBeenCalledOnce()
  })

  it("changes speed with the bracket keys", () => {
    const options = renderShortcuts({ speed: 1 })

    fireEvent.keyDown(window, { code: "BracketRight", key: "]" })

    expect(options.onSpeedChange).toHaveBeenCalledWith(1.5)
  })

  it("clamps speed changes at the limits", () => {
    const options = renderShortcuts({ speed: 2 })

    fireEvent.keyDown(window, { code: "BracketRight", key: "]" })

    expect(options.onSpeedChange).not.toHaveBeenCalled()
  })

  it("does nothing while the panel is inactive", () => {
    const options = renderShortcuts({ active: false })

    fireEvent.keyDown(window, { code: "Space", key: " " })
    fireEvent.keyDown(window, { key: "ArrowRight" })
    fireEvent.keyDown(window, { key: "Home" })
    fireEvent.keyDown(window, { code: "BracketLeft", key: "[" })

    expect(options.onTogglePlay).not.toHaveBeenCalled()
    expect(options.onStepForward).not.toHaveBeenCalled()
    expect(options.onReset).not.toHaveBeenCalled()
    expect(options.onSpeedChange).not.toHaveBeenCalled()
  })

  it("ignores modified shortcuts", () => {
    const options = renderShortcuts()

    fireEvent.keyDown(window, { code: "Space", key: " ", ctrlKey: true })
    fireEvent.keyDown(window, { key: "ArrowRight", metaKey: true })
    fireEvent.keyDown(window, { key: "Home", altKey: true })

    expect(options.onTogglePlay).not.toHaveBeenCalled()
    expect(options.onStepForward).not.toHaveBeenCalled()
    expect(options.onReset).not.toHaveBeenCalled()
  })

  it("ignores editable targets", () => {
    const options = createOptions()

    function Harness() {
      useKeyboardShortcuts(options)

      return (
        <div>
          <input aria-label="Value" />
          <textarea aria-label="Notes" />
          <div contentEditable aria-label="Editor" />
        </div>
      )
    }

    render(<Harness />)

    fireEvent.keyDown(screen.getByLabelText("Value"), { code: "Space", key: " " })
    fireEvent.keyDown(screen.getByLabelText("Notes"), { key: "ArrowRight" })
    fireEvent.keyDown(screen.getByLabelText("Editor"), { key: "Home" })

    expect(options.onTogglePlay).not.toHaveBeenCalled()
    expect(options.onStepForward).not.toHaveBeenCalled()
    expect(options.onReset).not.toHaveBeenCalled()
  })

  it("leaves Space to native button activation", () => {
    const options = createOptions()

    function Harness() {
      useKeyboardShortcuts(options)

      return <button type="button">Action</button>
    }

    render(<Harness />)

    fireEvent.keyDown(screen.getByRole("button", { name: "Action" }), {
      code: "Space",
      key: " ",
    })

    expect(options.onTogglePlay).not.toHaveBeenCalled()
  })

  it("leaves navigation keys to the tab strip", () => {
    const options = createOptions()

    function Harness() {
      useKeyboardShortcuts(options)

      return (
        <div role="tablist" aria-label="Structures">
          <button role="tab" type="button">
            Array
          </button>
        </div>
      )
    }

    render(<Harness />)

    fireEvent.keyDown(screen.getByRole("tab", { name: "Array" }), { key: "ArrowRight" })
    fireEvent.keyDown(screen.getByRole("tab", { name: "Array" }), { key: "Home" })

    expect(options.onStepForward).not.toHaveBeenCalled()
    expect(options.onReset).not.toHaveBeenCalled()
  })
})
