import { expect, test } from "@playwright/test"
import { openPlayground, structurePanel, structureTab } from "./helpers"

const structures = [
  { id: "array", tab: "Array", heading: "Array" },
  { id: "stack", tab: "Stack", heading: "Stack" },
  { id: "queue", tab: "Queue", heading: "Queue" },
  { id: "deque", tab: "Deque", heading: "Deque" },
  { id: "linked-list", tab: "Linked List", heading: "Doubly Linked List" },
] as const

test("exposes only the selected panel for each tab", async ({ page }) => {
  await openPlayground(page)

  for (const current of structures) {
    await structureTab(page, current.tab).click()

    await expect(page).toHaveURL(new RegExp(`\\?structure=${current.id}$`))
    await expect(structureTab(page, current.tab)).toHaveAttribute("aria-selected", "true")
    await expect(structurePanel(page, current.tab)).toBeVisible()
    await expect(page.getByRole("heading", { name: current.heading })).toBeVisible()

    for (const other of structures) {
      if (other.id === current.id) {
        continue
      }

      const hiddenPanel = page.locator(`#structure-panel-${other.id}`)

      await expect(hiddenPanel).toHaveAttribute("aria-hidden", "true")
      await expect(hiddenPanel).toHaveCSS("opacity", "0")
    }
  }
})

test("moves selection and focus through the tab strip with the keyboard", async ({ page }) => {
  await openPlayground(page)

  await structureTab(page, "Array").focus()
  await page.keyboard.press("ArrowRight")

  await expect(structureTab(page, "Stack")).toBeFocused()
  await expect(structureTab(page, "Stack")).toHaveAttribute("aria-selected", "true")
  await expect(page).toHaveURL(/\?structure=stack$/)

  await page.keyboard.press("End")

  await expect(structureTab(page, "Linked List")).toBeFocused()
  await expect(structureTab(page, "Linked List")).toHaveAttribute("aria-selected", "true")
  await expect(page).toHaveURL(/\?structure=linked-list$/)

  await page.keyboard.press("Home")

  await expect(structureTab(page, "Array")).toBeFocused()
  await expect(structureTab(page, "Array")).toHaveAttribute("aria-selected", "true")
  await expect(page).toHaveURL(/\?structure=array$/)

  await page.keyboard.press("ArrowLeft")

  await expect(structureTab(page, "Linked List")).toBeFocused()
  await expect(structureTab(page, "Linked List")).toHaveAttribute("aria-selected", "true")
})

test("preserves each structure's state while switching tabs", async ({ page }) => {
  await openPlayground(page)

  const arrayPanel = structurePanel(page, "Array")

  await arrayPanel.getByRole("spinbutton", { name: "Value", exact: true }).fill("42")
  await arrayPanel.getByRole("button", { name: "Append", exact: true }).click()
  await expect(arrayPanel.getByTestId("array-length")).toHaveText("length 4 / 4")

  await structureTab(page, "Stack").click()

  const stackPanel = structurePanel(page, "Stack")

  await stackPanel.getByRole("spinbutton", { name: "Value", exact: true }).fill("99")
  await stackPanel.getByRole("button", { name: "Push", exact: true }).click()
  await expect(stackPanel.getByTestId("stack-depth")).toHaveText("depth 4 / 6")

  await structureTab(page, "Array").click()

  await expect(structurePanel(page, "Array").getByTestId("array-length")).toHaveText("length 4 / 4")
  await expect(
    structurePanel(page, "Array").getByRole("img", { name: /12, 7, 24, 42/ }),
  ).toBeVisible()

  await structureTab(page, "Stack").click()

  await expect(structurePanel(page, "Stack").getByTestId("stack-depth")).toHaveText("depth 4 / 6")
  await expect(
    structurePanel(page, "Stack").getByRole("img", { name: /top is 99 at index 3/ }),
  ).toBeVisible()
})
