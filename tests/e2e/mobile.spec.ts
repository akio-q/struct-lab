import { devices, expect, test } from "@playwright/test"
import { openPlayground, structurePanel } from "./helpers"

test.use({ ...devices["Pixel 5"] })

test("mobile layout runs an operation with a fixed playback dock", async ({ page }) => {
  await openPlayground(page)

  await expect(page.getByRole("tablist", { name: "Structures" })).toBeVisible()

  const panel = structurePanel(page, "Array")
  const dock = page.getByRole("region", { name: "Playback" })

  await expect(panel.getByTestId("array-capacity")).toHaveText("4")
  await expect(panel.getByTestId("array-canvas")).toBeVisible()
  await expect(dock).toBeVisible()
  await expect(dock).toHaveCSS("position", "fixed")

  await panel.getByRole("spinbutton", { name: "Value", exact: true }).fill("42")
  await panel.getByRole("button", { name: "Append", exact: true }).click()

  await expect(panel.getByTestId("array-length")).toHaveText("length 4 / 4")
  await expect(dock.getByText("Step 2 of 2", { exact: true })).toBeVisible()
  await expect(dock.getByRole("button", { name: "Play" })).toBeEnabled()

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  )

  expect(hasHorizontalOverflow).toBe(false)

  const appendBox = await panel.getByRole("button", { name: "Append", exact: true }).boundingBox()
  const playBox = await dock.getByRole("button", { name: "Play" }).boundingBox()

  expect(appendBox?.height ?? 0).toBeGreaterThanOrEqual(44)
  expect(playBox?.width ?? 0).toBeGreaterThanOrEqual(44)
  expect(playBox?.height ?? 0).toBeGreaterThanOrEqual(44)
})
