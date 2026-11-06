import { expect, test } from "@playwright/test"
import { openPlayground, structurePanel, structureTab } from "./helpers"

test("loads the structure from ?structure and falls back for unknown values", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/?structure=stack")

  await expect(page).toHaveURL(/\?structure=stack$/)
  await expect(structureTab(page, "Stack")).toHaveAttribute("aria-selected", "true")
  await expect(structurePanel(page, "Stack")).toBeVisible()
  await expect(page.getByRole("heading", { name: "Stack" })).toBeVisible()

  await page.goto("/?structure=unknown")

  await expect(structureTab(page, "Array")).toHaveAttribute("aria-selected", "true")
  await expect(structurePanel(page, "Array")).toBeVisible()
  await expect(page.getByRole("heading", { name: "Array" })).toBeVisible()
})

test("selecting a tab updates the URL without reloading the page", async ({ page }) => {
  await openPlayground(page)
  await page.evaluate(() => {
    ;(window as Window & { __structLabNoReload?: boolean }).__structLabNoReload = true
  })

  await structureTab(page, "Stack").click()

  await expect(page).toHaveURL(/\?structure=stack$/)
  await expect(structureTab(page, "Stack")).toHaveAttribute("aria-selected", "true")
  await expect(structurePanel(page, "Stack")).toBeVisible()

  await structureTab(page, "Linked List").click()

  await expect(page).toHaveURL(/\?structure=linked-list$/)
  await expect(structureTab(page, "Linked List")).toHaveAttribute("aria-selected", "true")
  await expect(structurePanel(page, "Linked List")).toBeVisible()

  const stayedMounted = await page.evaluate(
    () => (window as Window & { __structLabNoReload?: boolean }).__structLabNoReload,
  )

  expect(stayedMounted).toBe(true)
})
