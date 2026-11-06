import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { PlaybackDock } from "@/components/structures/shared/playback-dock"

describe("PlaybackDock", () => {
  it("labels the dock and renders its controls", () => {
    render(
      <PlaybackDock>
        <button type="button">Play</button>
      </PlaybackDock>,
    )

    expect(screen.getByRole("region", { name: "Playback" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 3, name: "Playback" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument()
  })
})
