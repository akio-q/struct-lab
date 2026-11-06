import { expect, test } from "@playwright/test"
import { openPlayground, structurePanel } from "./helpers"

test("moves through the trace with the stepper and resets to the first step", async ({ page }) => {
  await openPlayground(page)

  const panel = structurePanel(page, "Array")

  await expect(panel.getByText("No steps", { exact: true })).toBeVisible()
  await expect(panel.getByRole("button", { name: "Step back" })).toBeDisabled()
  await expect(panel.getByRole("button", { name: "Play" })).toBeDisabled()
  await expect(panel.getByRole("button", { name: "Step forward" })).toBeDisabled()
  await expect(panel.getByRole("button", { name: "Reset trace" })).toBeDisabled()

  await panel.getByRole("spinbutton", { name: "Value", exact: true }).fill("42")
  await panel.getByRole("button", { name: "Append", exact: true }).click()

  await expect(panel.getByText("Step 2 of 2", { exact: true })).toBeVisible()
  await expect(panel.getByRole("button", { name: "Step back" })).toBeEnabled()
  await expect(panel.getByRole("button", { name: "Step forward" })).toBeDisabled()

  await panel.getByRole("button", { name: "Step back" }).click()

  await expect(panel.getByText("Step 1 of 2", { exact: true })).toBeVisible()
  await expect(panel.getByRole("button", { name: "Step back" })).toBeDisabled()
  await expect(panel.getByRole("button", { name: "Step forward" })).toBeEnabled()

  await panel.getByRole("button", { name: "Step forward" }).click()

  await expect(panel.getByText("Step 2 of 2", { exact: true })).toBeVisible()

  await panel.getByRole("button", { name: "Reset trace" }).click()

  await expect(panel.getByText("Step 1 of 2", { exact: true })).toBeVisible()
  await expect(panel.getByRole("button", { name: "Step back" })).toBeDisabled()
  await expect(panel.getByRole("button", { name: "Step forward" })).toBeEnabled()
})

test("changes playback speed from the speed controls and keyboard", async ({ page }) => {
  await openPlayground(page)

  const panel = structurePanel(page, "Array")
  const speed = panel.getByRole("group", { name: "Playback speed" })

  await expect(speed.getByRole("button", { name: "1×" })).toHaveAttribute("aria-pressed", "true")

  await speed.getByRole("button", { name: "1.5×" }).click()

  await expect(speed.getByRole("button", { name: "1.5×" })).toHaveAttribute("aria-pressed", "true")
  await expect(speed.getByRole("button", { name: "1×" })).toHaveAttribute("aria-pressed", "false")

  await speed.getByRole("button", { name: "2×" }).click()

  await expect(speed.getByRole("button", { name: "2×" })).toHaveAttribute("aria-pressed", "true")

  await page.keyboard.press("[")

  await expect(speed.getByRole("button", { name: "1.5×" })).toHaveAttribute("aria-pressed", "true")

  await page.keyboard.press("]")

  await expect(speed.getByRole("button", { name: "2×" })).toHaveAttribute("aria-pressed", "true")
})
