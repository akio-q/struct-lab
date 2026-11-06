import { expect, type Locator, type Page } from "@playwright/test"

/**
 * Opens the playground with reduced motion so playback does not advance on its
 * own. E2E tests can then assert exact trace steps and frame state.
 */
export async function openPlayground(page: Page, path = "/") {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto(path)
  await expect(page.getByRole("heading", { level: 1, name: "Structure Playground" })).toBeVisible()
}

/** Returns the tab panel for a structure, named by its tab. */
export function structurePanel(page: Page, name: string): Locator {
  return page.getByRole("tabpanel", { name })
}

/** Returns a structure tab by its visible label. */
export function structureTab(page: Page, name: string): Locator {
  return page.getByRole("tab", { name })
}

/** Returns the trace step list inside the active structure panel. */
export function traceSteps(page: Page): Locator {
  return page.getByRole("list", { name: "Trace steps" })
}
